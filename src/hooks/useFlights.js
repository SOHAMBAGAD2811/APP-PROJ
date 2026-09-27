import { useState, useEffect } from 'react';

const API_BASE = '';
const POLL_INTERVAL_MS = 1500;
const JOB_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * useFlights — source-aware data hook.
 * @param {string} source  "emt" | "ct" | "both"
 */
export function useFlights(source = 'emt') {
  const [flights, setFlights]       = useState([]);
  const [emtFlights, setEmtFlights] = useState([]);
  const [ctFlights, setCtFlights]   = useState([]);
  const [calendar, setCalendar]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [statusMsg, setStatusMsg]   = useState('');
  const [error, setError]           = useState(null);

  // ── Load cached data on mount / when source changes ──────────────────────
  useEffect(() => {
    async function loadCached() {
      try {
        if (source === 'both') {
          const [emtFares, ctFares, emtCal, ctCal] = await Promise.all([
            fetch(`${API_BASE}/api/emt/fares/cached`).then(r => r.json()).catch(() => []),
            fetch(`${API_BASE}/api/ct/fares/cached`).then(r => r.json()).catch(() => []),
            fetch(`${API_BASE}/api/emt/calendar/cached`).then(r => r.json()).catch(() => []),
            fetch(`${API_BASE}/api/ct/calendar/cached`).then(r => r.json()).catch(() => []),
          ]);
          const emt = Array.isArray(emtFares) ? emtFares : [];
          const ct  = Array.isArray(ctFares)  ? ctFares  : [];
          setEmtFlights(emt);
          setCtFlights(ct);
          const combined = [...emt, ...ct];
          if (combined.length > 0) setFlights(combined);
          const cal = [...(emtCal || []), ...(ctCal || [])];
          if (cal.length > 0) setCalendar(cal);
        } else {
          const [f, c] = await Promise.all([
            fetch(`${API_BASE}/api/${source}/fares/cached`).then(r => r.json()).catch(() => []),
            fetch(`${API_BASE}/api/${source}/calendar/cached`).then(r => r.json()).catch(() => []),
          ]);
          if (Array.isArray(f) && f.length > 0) setFlights(f);
          if (Array.isArray(c) && c.length > 0) setCalendar(c);
          setEmtFlights([]);
          setCtFlights([]);
        }
      } catch {
        // silently ignore cache load errors
      }
    }
    loadCached();
  }, [source]);

  // ── Job polling ──────────────────────────────────────────────────────────
  async function pollJob(jobId, label = 'job') {
    const deadline = Date.now() + JOB_TIMEOUT_MS;
    let elapsed = 0;
    while (Date.now() < deadline) {
      const res = await fetch(`${API_BASE}/api/jobs/${jobId}`);
      if (!res.ok) throw new Error(`Failed to poll ${label} status`);
      const data = await res.json();
      if (data.status === 'done')  return data.result;
      if (data.status === 'error') throw new Error(data.error || `${label} failed`);
      elapsed = Math.round((Date.now() - (deadline - JOB_TIMEOUT_MS)) / 1000);
      setStatusMsg(`⏳ Scraping ${label}… ${elapsed}s elapsed`);
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    }
    throw new Error(`${label} timed out after ${JOB_TIMEOUT_MS / 1000}s`);
  }

  // ── Kick off scrape for one source ──────────────────────────────────────
  async function _startScrapeForSource(src, params) {
    const { origin, destination, dates, time_from, time_to, fetchCalendar, cabin_class } = params;

    const scrapeRes = await fetch(`${API_BASE}/api/${src}/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, dates, time_from, time_to, cabin_class }),
    });
    if (!scrapeRes.ok) {
      const detail = await scrapeRes.text().catch(() => '');
      throw new Error(`Failed to start ${src} scrape: ${scrapeRes.status} ${detail}`);
    }
    const { job_id: scrapeJobId } = await scrapeRes.json();

    let calPromise = null;
    if (fetchCalendar) {
      const calRes = await fetch(`${API_BASE}/api/${src}/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination }),
      });
      if (calRes.ok) {
        const { job_id: calJobId } = await calRes.json();
        calPromise = pollJob(calJobId, `${src} calendar`);
      }
    }

    const [newFlights, newCalendar] = await Promise.all([
      pollJob(scrapeJobId, `${src} flights`),
      calPromise ? calPromise.catch(() => null) : Promise.resolve(null),
    ]);

    return { newFlights, newCalendar };
  }

  // ── Main search handler ──────────────────────────────────────────────────
  function clearData() {
    setFlights([]);
    setEmtFlights([]);
    setCtFlights([]);
    setCalendar([]);
    setStatusMsg('');
    setError(null);
  }

  async function searchFlights(params) {
    setLoading(true);
    setError(null);
    setStatusMsg('🚀 Starting scrape…');

    try {
      if (source === 'both') {
        setStatusMsg('🚀 Scraping EaseMyTrip & Cleartrip concurrently…');

        const [emtResult, ctResult] = await Promise.allSettled([
          _startScrapeForSource('emt', params),
          _startScrapeForSource('ct',  params),
        ]);

        const newEmt = emtResult.status === 'fulfilled' && Array.isArray(emtResult.value.newFlights)
          ? emtResult.value.newFlights : [];
        const newCt  = ctResult.status  === 'fulfilled' && Array.isArray(ctResult.value.newFlights)
          ? ctResult.value.newFlights  : [];

        setEmtFlights(newEmt);
        setCtFlights(newCt);

        let allCal = [];
        if (emtResult.status === 'fulfilled' && Array.isArray(emtResult.value.newCalendar))
          allCal = [...allCal, ...emtResult.value.newCalendar];
        if (ctResult.status  === 'fulfilled' && Array.isArray(ctResult.value.newCalendar))
          allCal = [...allCal, ...ctResult.value.newCalendar];

        const allFlights = [...newEmt, ...newCt];
        if (allFlights.length > 0) {
          setFlights(allFlights);
          setStatusMsg(`✅ Found ${newEmt.length} EMT + ${newCt.length} Cleartrip flights!`);
        } else {
          setStatusMsg('⚠️ No flights found for the selected criteria.');
        }
        if (allCal.length > 0) setCalendar(allCal);

      } else {
        // Single source — clear per-source arrays
        setEmtFlights([]);
        setCtFlights([]);
        const { newFlights, newCalendar } = await _startScrapeForSource(source, params);

        if (Array.isArray(newFlights) && newFlights.length > 0) {
          setFlights(newFlights);
          setStatusMsg(`✅ Found ${newFlights.length} flight(s)!`);
        } else {
          setStatusMsg('⚠️ No flights found for the selected criteria.');
        }
        if (Array.isArray(newCalendar)) setCalendar(newCalendar);
      }

    } catch (err) {
      console.error(err);
      setError(err.message);
      setStatusMsg('');
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMsg(prev => prev.startsWith('✅') ? '' : prev), 4000);
    }
  }

  return { flights, emtFlights, ctFlights, calendar, loading, statusMsg, error, searchFlights, clearData };
}

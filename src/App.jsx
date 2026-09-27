import { useEffect, useState } from 'react';
import { Plane, Scale, List, LayoutList, AreaChart, CalendarDays, Zap, Clock3, ArrowRight, RefreshCw, X } from 'lucide-react';
import SearchPanel    from './components/SearchPanel';
import StatsBar       from './components/StatsBar';
import FlightsTable   from './components/FlightsTable';
import GroupedView    from './components/GroupedView';
import ChartPanel     from './components/ChartPanel';
import CalendarChart  from './components/CalendarChart';
import CompareTable   from './components/CompareTable';
import SourceSelector from './components/SourceSelector';
import SkeletonLoader from './components/SkeletonLoader';
import { useFlights } from './hooks/useFlights';
import APIxTab        from './components/APIxTab';
import ScrapeProgressBar from './components/ScrapeProgressBar';
import FloatingChatWidget from './components/FloatingChatWidget';

export default function App() {
  const [source, setSource]       = useState('emt');
  const [activeTab, setActiveTab] = useState('table');
  const [sweepState, setSweepState] = useState(null); // null | 'running' | 'done' | 'error'
  const [sweepProgress, setSweepProgress] = useState(0);
  const [sweepStage, setSweepStage] = useState('');
  const [sweepStep, setSweepStep] = useState(0);
  const [sweepDetails, setSweepDetails] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [sweepInfo, setSweepInfo] = useState(null);

  const {
    flights, emtFlights, ctFlights,
    calendar, loading, progress, stage, step, totalSteps, details,
    statusMsg, error, searchFlights, clearData
  } = useFlights(source);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/sweep-status')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (!cancelled && data) setSweepInfo(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [sweepState]);

  function openManualSearch() {
    setManualOpen(true);
    requestAnimationFrame(() => document.getElementById('manual-search')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  const tabs = [
    { id: 'table',    label: <><List size={16} /> List View</> },
    ...(source === 'both' ? [{ id: 'compare', label: <><Scale size={16} /> Compare</> }] : []),
    { id: 'grouped',  label: <><LayoutList size={16} /> Grouped View</> },
    { id: 'charts',   label: <><AreaChart size={16} /> Analytics</> },
    { id: 'calendar', label: <><CalendarDays size={16} /> Fare Calendar</> },
  ];

  function handleSourceChange(s) {
    setSource(s);
    setActiveTab('table');
  }

  async function triggerSweep() {
    if (sweepState === 'running') return;
    setSweepState('running');
    setSweepProgress(10);
    setSweepStage('Basket Sweep: Initializing');
    setSweepStep(1);
    setSweepDetails('Initializing sweep across all 6 core domestic trunk corridors...');

    try {
      const res = await fetch('/api/admin/trigger-sweep', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (!res.ok) throw new Error(await res.text());
      const { job_id } = await res.json();

      const poll = async () => {
        const j = await fetch(`/api/jobs/${job_id}`).then(r => r.json());
        if (j.progress != null) setSweepProgress(j.progress);
        if (j.stage) setSweepStage(j.stage);
        if (j.step != null) setSweepStep(j.step);
        if (j.details) setSweepDetails(j.details);

        if (j.status === 'done') {
          setSweepProgress(100);
          setSweepState('done');
          setTimeout(() => {
            setSweepState(null);
            setSweepProgress(0);
          }, 5000);
        } else if (j.status === 'error') {
          setSweepState('error');
          setTimeout(() => {
            setSweepState(null);
            setSweepProgress(0);
          }, 8000);
        } else {
          setTimeout(poll, 600);
        }
      };
      setTimeout(poll, 600);
    } catch {
      setSweepState('error');
      setTimeout(() => {
        setSweepState(null);
        setSweepProgress(0);
      }, 8000);
    }
  }

  return (
    <>
      <header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="/" className="app-logo">
              <div className="app-logo-icon">
              <Plane size={18} strokeWidth={2.2} />
            </div>
            <div>
              <div className="app-logo-text">AiRa</div>
              <div className="app-logo-sub">INDIA FARE INTELLIGENCE</div>
            </div>
          </a>

          </div>
        

        {/* Trigger Basket Sweep button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={triggerSweep}
            disabled={sweepState === 'running'}
            className={`btn btn-sm ${sweepState === 'done' ? 'btn-primary' : sweepState === 'error' ? '' : 'btn-ghost'}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '0.8rem',
              fontWeight: 600,
              ...(sweepState === 'error' ? { color: 'var(--red)', borderColor: 'var(--red-border)', background: 'var(--red-bg)' } : {}),
            }}
          >
            <Zap size={14} />
            {sweepState === 'running' ? 'Updating fares…' : sweepState === 'done' ? '✓ Update complete' : sweepState === 'error' ? '✕ Update failed' : 'Run basket sweep'}
            {sweepState === 'running' && (
              <span style={{
                width: 12, height: 12, borderRadius: '50%',
                border: '2px solid rgba(37,99,235,0.25)',
                borderTopColor: 'var(--accent-1)',
                animation: 'spin 0.7s linear infinite',
                display: 'inline-block',
              }} />
            )}
          </button>
        </div>
      </header>

      <main className="app-main">
        <section className="page-intro">
          <div>
            <h1>Search fares</h1>
            <p>Compare live listings and fare history across domestic routes.</p>
          </div>
          <div className="intro-aside"><Plane size={15} /><span>One-way · Domestic Corridors</span></div>
        </section>

        <section className="collection-panel">
          <div className="collection-head">
            <div className="collection-symbol"><Clock3 size={20} strokeWidth={2} /></div>
            <div className="collection-copy">
              <div className="collection-title-row">
                <h2>Scheduled fare collection</h2>
                <span className="schedule-tag"><span className="live-dot" /> DAILY PLAN</span>
              </div>
              <p>Basket sweep plan · 6 domestic corridors · lead times T+1, T+7, T+15, T+30 and T+45</p>
              <div className="collection-corridors">
                {['DEL-BOM', 'DEL-BLR', 'BOM-BLR', 'DEL-CCU', 'MAA-DEL', 'BLR-HYD'].map(c => (
                  <span key={c} className="corridor-chip">{c}</span>
                ))}
                <span className="corridor-chip lead-chip">T+1 to T+45</span>
              </div>
            </div>
            <div className="collection-time">
              <span>COLLECTION WINDOW</span>
              <strong>02:00 <small>IST</small></strong>
              <em>Every day</em>
            </div>
          </div>
          <div className="collection-foot">
            <span className="last-sweep">
              <span className={`sweep-indicator ${sweepInfo?.status === 'done' ? 'complete' : sweepInfo?.status === 'running' ? 'running' : ''}`} />
              {sweepInfo?.status === 'done' && sweepInfo?.started_at
                ? `Last sweep · ${new Date(sweepInfo.started_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`
                : sweepInfo?.status === 'running'
                ? 'Basket sweep in progress…'
                : 'No completed basket sweep recorded yet'}
            </span>
            <span className="plan-note">TimescaleDB automated pipeline</span>
          </div>
        </section>

        <div className="manual-search-cta">
          <div>
            <span className="manual-kicker">ON-DEMAND SEARCH</span>
            <h2>Need a specific route?</h2>
            <p>Scrape live fares for custom airport pairs, dates, and cabin classes.</p>
          </div>
          <button
            className={`btn ${manualOpen ? 'btn-ghost' : 'btn-primary'} btn-lg`}
            onClick={() => setManualOpen(!manualOpen)}
          >
            <Plane size={16} />
            {manualOpen ? 'Hide route search' : 'Manually scrape a path'}
            {!manualOpen && <ArrowRight size={16} />}
          </button>
        </div>

        {manualOpen && (
          <section className="manual-search-panel anim-slide" id="manual-search">
            <div className="manual-panel-heading">
              <div>
                <span className="manual-kicker">CUSTOM ROUTE</span>
                <h2>Scrape a path</h2>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setManualOpen(false)}>
                <X size={14} /> Close
              </button>
            </div>
            <SourceSelector value={source} onChange={handleSourceChange} />
            <SearchPanel onSearch={searchFlights} loading={loading} onClear={clearData} hasData={flights.length > 0} />
          </section>
        )}

        {/* Live Backend Scraping Progress Bar */}
        {(loading || (progress > 0 && progress < 100)) && (
          <ScrapeProgressBar
            loading={loading}
            progress={progress}
            stage={stage}
            step={step}
            totalSteps={totalSteps}
            details={details}
            source={source}
          />
        )}

        {/* Autonomous DGCA Basket Sweep Progress Bar */}
        {(sweepState === 'running' || (sweepProgress > 0 && sweepProgress < 100)) && (
          <ScrapeProgressBar
            loading={sweepState === 'running'}
            progress={sweepProgress}
            stage={sweepStage}
            step={sweepStep}
            totalSteps={6}
            details={sweepDetails}
            source="DGCA SWEEP"
          />
        )}

        {statusMsg && !loading && sweepState !== 'running' && (
          <div className="glass anim-fade-in" style={{
            padding: '12px 16px',
            color: 'var(--accent-2)',
            background: 'var(--accent-light)',
            borderColor: '#bfdbfe',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.88rem',
            fontWeight: 500,
            marginBottom: '16px',
          }}>
            {statusMsg}
          </div>
        )}

        {error && (
          <div className="glass" style={{
            padding: '14px 16px',
            color: 'var(--red-text)',
            background: 'var(--red-bg)',
            borderColor: 'var(--red-border)',
            fontSize: '0.88rem',
            fontWeight: 500,
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <StatsBar
          fares={flights}
          emtFlights={emtFlights}
          ctFlights={ctFlights}
          calendarData={calendar}
        />

        {flights.length > 0 && !loading && (
          <div className="glass anim-fade-in" style={{ padding: '24px' }}>
            <div className="tab-bar" style={{ marginBottom: '24px' }}>
              {tabs.map(t => (
                <button
                  key={t.id}
                  className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="tab-content">
              {activeTab === 'table'    && <FlightsTable fares={flights} showProvider={source === 'both'} />}
              {activeTab === 'compare'  && <CompareTable emtFlights={emtFlights} ctFlights={ctFlights} />}
              {activeTab === 'grouped'  && <GroupedView fares={flights} />}
              {activeTab === 'charts'   && <ChartPanel fares={flights} />}
              {activeTab === 'calendar' && <CalendarChart data={calendar} />}
            </div>
          </div>
        )}

        {loading && <SkeletonLoader />}

        {/* ── Airfare Price Index (APIx) — always visible, reads TimescaleDB history ── */}
        <div className="glass anim-fade-in" style={{ padding: '24px' }}>
          <APIxTab />
        </div>
      </main>

      {/* Floating AI Chat Assistant (Small widget or Fullscreen) */}
      <FloatingChatWidget
        source={source}
        fares={flights}
        emtFlights={emtFlights}
        ctFlights={ctFlights}
      />
    </>
  );
}

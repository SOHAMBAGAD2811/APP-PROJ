import { useState, useEffect } from 'react';
import { Plane, ArrowLeftRight } from 'lucide-react';

const FALLBACK_AIRPORTS = {
  DEL: 'Delhi', BOM: 'Mumbai', BLR: 'Bangalore', HYD: 'Hyderabad',
  MAA: 'Chennai', CCU: 'Kolkata',
};

const DATE_MODES = [
  { value: 'single',    label: 'Single Date' },
  { value: 'multi',     label: 'Multiple Dates' },
  { value: 'range',     label: 'Date Range' },
];

const CABIN_CLASSES = [
  { value: 'economy',         label: 'Economy'         },
  { value: 'premium_economy', label: 'Premium Economy' },
  { value: 'business',        label: 'Business'        },
  { value: 'first',           label: 'First Class'     },
];

function AirportSelect({ id, label, value, onChange, airports }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <select id={id} className="select" value={value} onChange={e => onChange(e.target.value)}>
        {Object.entries(airports).map(([code, city]) => (
          <option key={code} value={code}>{code} — {city}</option>
        ))}
      </select>
    </div>
  );
}

export default function SearchPanel({ onSearch, loading, onClear, hasData }) {
  const [airports, setAirports]       = useState(FALLBACK_AIRPORTS);
  const [origin, setOrigin]           = useState('MAA');
  const [destination, setDestination] = useState('DEL');
  const [dateMode, setDateMode]       = useState('single');
  const [cabinClass, setCabinClass]   = useState('economy');
  const [singleDate, setSingleDate]   = useState(getTomorrow());
  const [multiDates, setMultiDates]   = useState('');
  const [rangeStart, setRangeStart]   = useState(getTomorrow());
  const [rangeEnd, setRangeEnd]       = useState(getNext7());
  const [timeFrom, setTimeFrom]       = useState('00:00');
  const [timeTo, setTimeTo]           = useState('23:59');
  const [fetchCalendar, setFetchCal]  = useState(true);

  useEffect(() => {
    fetch('/api/airports')
      .then(r => r.json())
      .then(data => { if (data && typeof data === 'object') setAirports(data); })
      .catch(() => {/* keep fallback */});
  }, []);

  function getTomorrow() {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  function getNext7() {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }

  function buildDates() {
    if (dateMode === 'single') return [singleDate];
    if (dateMode === 'range') {
      const dates = [];
      const cur = new Date(rangeStart);
      const end = new Date(rangeEnd);
      while (cur <= end) {
        dates.push(cur.toISOString().slice(0, 10));
        cur.setDate(cur.getDate() + 1);
      }
      return dates;
    }
    return multiDates.split(/[\s,]+/).filter(Boolean);
  }

  function handleSwap() {
    setOrigin(destination);
    setDestination(origin);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const dates = buildDates();
    if (!dates.length) return;
    onSearch({
      origin, destination, dates,
      time_from: timeFrom !== '00:00' ? timeFrom : null,
      time_to:   timeTo !== '23:59' ? timeTo : null,
      fetchCalendar,
      cabin_class: cabinClass,
    });
  }

  return (
    <div className="glass search-panel anim-slide">
      <form onSubmit={handleSubmit}>
        {/* Row 1: Route + Dates */}
        <div className="search-grid">
          {/* Origin + Destination */}
          <div className="search-route">
            <div style={{ flex: 1 }}>
              <AirportSelect id="origin" label="Origin Airport" value={origin} onChange={setOrigin} airports={airports} />
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              style={{
                marginBottom: 0, padding: '9px 12px', flexShrink: 0,
                color: 'var(--text-secondary)',
              }}
              onClick={handleSwap}
              title="Swap Origin and Destination"
            >
              <ArrowLeftRight size={15} />
            </button>
            <div style={{ flex: 1 }}>
              <AirportSelect id="destination" label="Destination Airport" value={destination} onChange={setDestination} airports={airports} />
            </div>
          </div>

          {/* Cabin Class */}
          <div>
            <label className="label">Cabin Class</label>
            <select className="select" value={cabinClass} onChange={e => setCabinClass(e.target.value)}>
              {CABIN_CLASSES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Date mode */}
          <div>
            <label className="label">Date Mode</label>
            <select className="select" value={dateMode} onChange={e => setDateMode(e.target.value)}>
              {DATE_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          {dateMode === 'single' && (
            <div>
              <label className="label" htmlFor="singleDate">Travel Date</label>
              <input id="singleDate" type="date" className="input" value={singleDate} min={new Date().toISOString().slice(0,10)} onChange={e => setSingleDate(e.target.value)} />
            </div>
          )}
          {dateMode === 'multi' && (
            <div>
              <label className="label" htmlFor="multiDates">Dates (comma/space separated)</label>
              <input id="multiDates" type="text" className="input" value={multiDates} placeholder="2026-09-20, 2026-09-25" onChange={e => setMultiDates(e.target.value)} />
            </div>
          )}
          {dateMode === 'range' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label className="label" htmlFor="rangeStart">From Date</label>
                <input id="rangeStart" type="date" className="input" value={rangeStart} min={new Date().toISOString().slice(0,10)} onChange={e => setRangeStart(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="label" htmlFor="rangeEnd">To Date</label>
                <input id="rangeEnd" type="date" className="input" value={rangeEnd} min={rangeStart} onChange={e => setRangeEnd(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* Row 2: Time filter + Calendar toggle + Search btn */}
        <div className="search-row-2">
          {/* Time window */}
          <div>
            <label className="label">Departure Window</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="time" className="input" value={timeFrom} onChange={e => setTimeFrom(e.target.value)} title="From" />
              <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>–</span>
              <input type="time" className="input" value={timeTo} onChange={e => setTimeTo(e.target.value)} title="To" />
            </div>
          </div>

          {/* Calendar toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 6 }}>
            <label className="label">3-Month Forecast</label>
            <div className="flex items-center gap-3" style={{ height: '38px' }}>
              <label className="toggle">
                <input type="checkbox" checked={fetchCalendar} onChange={e => setFetchCal(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
              <span className="text-sm text-secondary" style={{ fontWeight: 500 }}>{fetchCalendar ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>

          {/* Search button */}
          <div className="search-btn-wrap" style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flex: 1 }}>
              {loading ? <><div className="spinner" /> Scraping Live Fares...</> : <><Plane size={17} /> Search Airfares</>}
            </button>
            {hasData && (
              <button
                type="button"
                className="btn btn-ghost btn-lg"
                onClick={onClear}
                style={{
                  color: 'var(--red)',
                  borderColor: 'var(--border)',
                  flex: '0 0 auto',
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

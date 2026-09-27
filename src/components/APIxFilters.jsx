/**
 * APIxFilters.jsx — Filter bar for the APIx tab.
 * Controls: Origin, Destination, Source, Time Bucket, History window, Base-period slider.
 */

const AIRPORTS = {
  '': 'All Corridors (National)',
  DEL: 'Delhi (DEL)', BOM: 'Mumbai (BOM)',
  BLR: 'Bengaluru (BLR)', MAA: 'Chennai (MAA)',
  CCU: 'Kolkata (CCU)', HYD: 'Hyderabad (HYD)',
  AMD: 'Ahmedabad (AMD)', COK: 'Kochi (COK)',
  GOI: 'Goa (GOI)', JAI: 'Jaipur (JAI)',
  PNQ: 'Pune (PNQ)', LKO: 'Lucknow (LKO)',
};

const BUCKETS = [
  { label: '1 Hour',  value: '1 hour' },
  { label: '6 Hours', value: '6 hours' },
  { label: '1 Day',   value: '1 day' },
  { label: '1 Week',  value: '1 week' },
];

const DAYS = [7, 14, 30, 60, 90];

const selectStyle = {
  background: '#ffffff',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: 'var(--r-sm)',
  padding: '6px 10px',
  fontSize: '0.84rem',
  fontWeight: 500,
  boxShadow: 'var(--shadow-xs)',
};

const labelStyle = {
  fontSize: '0.72rem',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

export default function APIxFilters({
  origin, setOrigin,
  destination, setDestination,
  source, setSource,
  bucket, setBucket,
  daysBack, setDaysBack,
  baseDays, setBaseDays,
  isNationalView,
}) {
  return (
    <div className="glass-sm" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '14px 18px', alignItems: 'flex-end' }}>
      {[
        { label: 'Origin',      value: origin,      set: setOrigin },
        { label: 'Destination', value: destination, set: setDestination },
      ].map(({ label, value, set }) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={labelStyle}>{label}</label>
          <select value={value} onChange={e => set(e.target.value)} style={{ ...selectStyle, minWidth: 160 }}>
            {Object.entries(AIRPORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      ))}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={labelStyle}>Source</label>
        <select value={source} onChange={e => setSource(e.target.value)} style={selectStyle}>
          <option value="">Both (EMT + CT)</option>
          <option value="emt">EaseMyTrip</option>
          <option value="ct">Cleartrip</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={labelStyle}>Time Bucket</label>
        <select value={bucket} onChange={e => setBucket(e.target.value)} style={selectStyle}>
          {BUCKETS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={labelStyle}>History</label>
        <select value={daysBack} onChange={e => setDaysBack(Number(e.target.value))} style={selectStyle}>
          {DAYS.map(d => <option key={d} value={d}>Last {d} days</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={labelStyle}>
          Base Window&nbsp;<span style={{ color: 'var(--accent-1)', fontWeight: 700 }}>{baseDays}d</span>
        </label>
        <input
          type="range"
          min={1}
          max={Math.max(1, daysBack - 1)}
          value={baseDays}
          onChange={e => setBaseDays(Number(e.target.value))}
          style={{ width: 110, accentColor: 'var(--accent-1)' }}
        />
      </div>

      {!isNationalView && (
        <button
          onClick={() => { setOrigin(''); setDestination(''); }}
          className="btn-secondary"
          style={{ fontSize: '0.78rem', padding: '6px 12px', height: 34 }}
        >
          Clear Route Filter
        </button>
      )}
    </div>
  );
}

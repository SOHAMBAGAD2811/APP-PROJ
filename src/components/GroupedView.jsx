import { useState, useMemo } from 'react';
import { ProviderBadge, AirlineLogo } from './Logos';
import { LayoutList } from 'lucide-react';

const fmt  = n  => n != null ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—';
const fmtT = dt => dt ? dt.slice(11, 16) : '—';
const fmtD = m  => m != null ? `${Math.floor(m/60)}h ${m%60}m` : '—';

function StopsBadge({ stops }) {
  if (stops === 0) return <span className="badge badge-green">Non-stop</span>;
  if (stops === 1) return <span className="badge badge-amber">1 Stop</span>;
  return <span className="badge badge-red">{stops} Stops</span>;
}

function FlightCard({ f }) {
  return (
    <div className="flight-row-card">
      <div className="flight-info">
        <div className="flight-num" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {f.flight_number}
          <ProviderBadge provider={f.provider} />
        </div>
        <div className="flight-time" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AirlineLogo airlineCode={f.airline} /> <span style={{ opacity: 0.5 }}>·</span> {f.travel_date}
        </div>
      </div>
      <div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{fmtT(f.departure_datetime)}</div>
        <div className="text-xs text-muted">Dep</div>
      </div>
      <div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{fmtT(f.arrival_datetime)}</div>
        <div className="text-xs text-muted">Arr</div>
      </div>
      <div>
        <div className="text-secondary text-sm">{fmtD(f.duration_minutes)}</div>
        <div className="text-xs text-muted">Duration</div>
      </div>
      <div><StopsBadge stops={f.stops} /></div>
      <div style={{ textAlign: 'right' }}>
        <div className="price price-total" style={{ fontSize: '1rem' }}>{fmt(f.total_fare)}</div>
        <div className="text-xs text-muted">{fmt(f.base_fare)} + {fmt(f.taxes)}</div>
      </div>
    </div>
  );
}

function GroupSection({ title, subtitle, items }) {
  const [open, setOpen] = useState(true);
  const sorted  = [...items].sort((a, b) => (a.total_fare || 999999) - (b.total_fare || 999999));
  const cheapest = sorted[0]?.total_fare;
  const emtCount = items.filter(f => f.provider === 'easemytrip').length;
  const ctCount  = items.filter(f => f.provider === 'cleartrip' || f.provider === 'google_flights').length;
  const hasMultiSource = emtCount > 0 && ctCount > 0;

  return (
    <div style={{ marginBottom: 12 }}>
      <div className="group-header" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '1.1rem' }}>{open ? '▼' : '▶'}</span>
          <div>
            <div style={{ fontWeight: 700 }}>{title}</div>
            {subtitle && <div className="text-xs text-muted">{subtitle}</div>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasMultiSource && (
            <span className="text-xs text-muted">
              <span className="badge badge-blue"  style={{ fontSize: '0.62rem' }}>EMT {emtCount}</span>
              {' '}
              <span className="badge badge-green" style={{ fontSize: '0.62rem' }}>GF {ctCount}</span>
            </span>
          )}
          <span className="text-sm text-secondary">{items.length} flight{items.length !== 1 ? 's' : ''}</span>
          {cheapest != null && (
            <span className="badge badge-accent">from {fmt(cheapest)}</span>
          )}
        </div>
      </div>
      {open && (
        <div className="group-body">
          {sorted.map((f, i) => <FlightCard key={i} f={f} />)}
        </div>
      )}
    </div>
  );
}

const GROUP_OPTIONS = [
  { value: 'date',    label: 'By Date'    },
  { value: 'airline', label: 'By Airline' },
  { value: 'stops',   label: 'By Stops'   },
  { value: 'source',  label: 'By Source'  },
];

export default function GroupedView({ fares }) {
  const [groupBy, setGroupBy] = useState('date');

  const groups = useMemo(() => {
    if (!fares?.length) return {};
    const out = {};
    fares.forEach(f => {
      let key;
      if (groupBy === 'date')    key = f.travel_date || 'Unknown Date';
      if (groupBy === 'airline') key = f.airline || 'Unknown Airline';
      if (groupBy === 'stops')   key = f.stops === 0 ? 'Non-stop' : f.stops === 1 ? '1 Stop' : '2+ Stops';
      if (groupBy === 'source') {
        if (f.provider === 'easemytrip') key = 'EaseMyTrip';
        else if (f.provider === 'cleartrip' || f.provider === 'google_flights') key = 'Google Flights';
        else key = f.provider || 'Unknown Source';
      }
      if (!out[key]) out[key] = [];
      out[key].push(f);
    });
    return out;
  }, [fares, groupBy]);

  if (!fares || fares.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><LayoutList size={48} color="var(--text-muted)" style={{ opacity: 0.5 }} /></div>
        <div className="empty-title">No flight data yet</div>
        <div className="empty-sub">Run a search to see grouped flight data.</div>
      </div>
    );
  }

  const sortedKeys = Object.keys(groups).sort();

  function subtitle(key) {
    const items = groups[key];
    if (groupBy === 'date')    return `${items.length} flight${items.length !== 1 ? 's' : ''} on ${key}`;
    if (groupBy === 'airline') return `${items.length} flight${items.length !== 1 ? 's' : ''} by ${key}`;
    if (groupBy === 'source')  return `${items.length} flight${items.length !== 1 ? 's' : ''}`;
    return null;
  }

  return (
    <div className="anim-fade">
      <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
        <label className="label" style={{ margin: 0 }}>Group by:</label>
        <div className="tab-bar" style={{ flex: 'none' }}>
          {GROUP_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`tab-btn ${groupBy === opt.value ? 'active' : ''}`}
              onClick={() => setGroupBy(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="text-sm text-muted" style={{ marginLeft: 'auto' }}>
          {sortedKeys.length} group{sortedKeys.length !== 1 ? 's' : ''}
        </span>
      </div>

      {sortedKeys.map(key => (
        <GroupSection
          key={key}
          title={key}
          subtitle={subtitle(key)}
          items={groups[key]}
        />
      ))}
    </div>
  );
}

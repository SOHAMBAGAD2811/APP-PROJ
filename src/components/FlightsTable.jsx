import { useState, useMemo } from 'react';
import { Plane, SlidersHorizontal, Clock, Tag } from 'lucide-react';
import { ProviderBadge, AirlineLogo } from './Logos';

// ── Column definitions ────────────────────────────────────────────────────────
const BASE_COLS = [
  { key: 'flight_number',      label: 'Flight',    width: '110px', sortable: true  },
  { key: 'airline',            label: 'Airline',   width: '80px',  sortable: true  },
  { key: 'travel_date',        label: 'Date',      width: '105px', sortable: true  },
  { key: 'departure_datetime', label: 'Dep',       width: '60px',  sortable: true  },
  { key: 'arrival_datetime',   label: 'Arr',       width: '60px',  sortable: true  },
  { key: 'duration_minutes',   label: 'Dur',       width: '70px',  sortable: true  },
  { key: 'stops',              label: 'Stops',     width: '70px',  sortable: true  },
  { key: 'fare_family',        label: 'Fare Class',width: '90px',  sortable: false },
  { key: 'cabin_class',        label: 'Cabin',     width: '90px',  sortable: true  },
  { key: 'base_fare',          label: 'Base Fare', width: '100px', sortable: true  },
  { key: 'taxes',              label: 'Taxes',     width: '90px',  sortable: true  },
  { key: 'total_fare',         label: 'Total',     width: '110px', sortable: true  },
  { key: 'validation_status',  label: 'Status',    width: '80px',  sortable: false },
];
const SOURCE_COL = { key: 'provider', label: 'Source', width: '75px', sortable: true };

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt  = n  => n != null ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—';
const fmtT = dt => dt ? dt.slice(11, 16) : '—';
const fmtD = m  => m != null ? `${Math.floor(m/60)}h ${m%60}m` : '—';

// ── Badges ────────────────────────────────────────────────────────────────────
function StopsBadge({ stops }) {
  if (stops === 0) return <span className="badge badge-green">Non-stop</span>;
  if (stops === 1) return <span className="badge badge-amber">1 Stop</span>;
  return <span className="badge badge-red">{stops} Stops</span>;
}

function StatusBadge({ status }) {
  const cls = status === 'valid' ? 'badge-green' : status === 'partial' ? 'badge-blue' : 'badge-red';
  return <span className={`badge ${cls}`}>{status ?? '—'}</span>;
}

function CabinBadge({ cabin }) {
  if (!cabin || cabin === 'unknown') return <span className="text-muted" style={{ fontSize: '0.8rem' }}>—</span>;
  const map = {
    economy:         { label: 'Economy',    cls: 'badge-blue'  },
    premium_economy: { label: 'Prem. Eco.', cls: 'badge-blue'  },
    business:        { label: 'Business',   cls: 'badge-amber' },
    first:           { label: 'First',      cls: 'badge-accent'},
  };
  const { label, cls } = map[cabin] || { label: cabin, cls: 'badge-blue' };
  return <span className={`badge ${cls}`} style={{ fontSize: '0.7rem' }}>{label}</span>;
}

// ── CSV export ────────────────────────────────────────────────────────────────
function exportCSV(data, cols) {
  const keys   = cols.map(c => c.key);
  const header = cols.map(c => c.label).join(',');
  const rows   = data.map(row =>
    keys.map(k => {
      const v = row[k];
      if (k === 'departure_datetime' || k === 'arrival_datetime') return fmtT(v);
      if (k === 'duration_minutes')  return fmtD(v);
      return v ?? '';
    }).join(',')
  );
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'airfares.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ── Time-of-day config ────────────────────────────────────────────────────────
const TIME_SLOTS = [
  { id: 'morning',   label: '🌅 Morning',   from: '06:00', to: '12:00' },
  { id: 'afternoon', label: '☀️ Afternoon', from: '12:00', to: '18:00' },
  { id: 'evening',   label: '🌙 Evening',   from: '18:00', to: '23:59' },
  { id: 'night',     label: '🌃 Night',     from: '00:00', to: '06:00' },
];

function depHHMM(fare) {
  const dt = fare.departure_datetime;
  if (!dt) return null;
  return dt.slice(11, 16); // "HH:MM"
}

function inTimeSlot(fare, slotId) {
  if (slotId === 'all') return true;
  const t = depHHMM(fare);
  if (!t) return false;
  const slot = TIME_SLOTS.find(s => s.id === slotId);
  if (!slot) return false;
  if (slot.id === 'night') {
    return t >= '00:00' && t < '06:00';
  }
  return t >= slot.from && t < slot.to;
}

// ── Airline extractor ─────────────────────────────────────────────────────────
function getAirlines(fares) {
  const airlines = new Set();
  for (const f of fares) {
    const code = (f.airline || '').trim().slice(0, 2).toUpperCase();
    if (code) airlines.add(code);
  }
  return [...airlines].sort();
}

// ── Price Range Slider ────────────────────────────────────────────────────────
function PriceRangeSlider({ min, max, value, onChange }) {
  const [low, high] = value;
  const pct = v => Math.round(((v - min) / (max - min)) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <span>₹{low.toLocaleString('en-IN')}</span>
        <span>₹{high.toLocaleString('en-IN')}</span>
      </div>
      <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
        {/* Track */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 4,
          borderRadius: 2, background: 'rgba(255,255,255,0.1)',
        }} />
        {/* Active range */}
        <div style={{
          position: 'absolute',
          left: `${pct(low)}%`,
          right: `${100 - pct(high)}%`,
          height: 4, borderRadius: 2,
          background: 'var(--accent-1)',
        }} />
        {/* Low thumb */}
        <input
          type="range" min={min} max={max} value={low}
          onChange={e => {
            const v = +e.target.value;
            if (v <= high) onChange([v, high]);
          }}
          style={{ position: 'absolute', width: '100%', opacity: 0, cursor: 'pointer', height: 20 }}
        />
        {/* High thumb */}
        <input
          type="range" min={min} max={max} value={high}
          onChange={e => {
            const v = +e.target.value;
            if (v >= low) onChange([low, v]);
          }}
          style={{ position: 'absolute', width: '100%', opacity: 0, cursor: 'pointer', height: 20 }}
        />
      </div>
    </div>
  );
}

// ── Advanced Filter Panel ─────────────────────────────────────────────────────
function FilterPanel({ fares, priceRange, onPriceRange, timeSlot, onTimeSlot, airlines, onAirlines }) {
  const prices = (fares || []).map(f => +(f.total_fare || f.base_fare || 0)).filter(Boolean);
  const priceMin = prices.length ? Math.floor(Math.min(...prices)) : 0;
  const priceMax = prices.length ? Math.ceil(Math.max(...prices))  : 100000;

  const uniqueAirlines = getAirlines(fares || []);

  return (
    <div style={{
      background: 'var(--bg-subtle)',
      padding: '14px 18px',
      marginBottom: 16,
      display: 'flex',
      flexWrap: 'wrap',
      gap: '24px',
      alignItems: 'flex-start',
      borderRadius: 'var(--r-sm)',
      border: '1px solid var(--border)',
    }}>
      {/* Price Range */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Tag size={13} color="var(--accent-1)" />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Price Range</span>
        </div>
        <PriceRangeSlider
          min={priceMin}
          max={priceMax}
          value={priceRange || [priceMin, priceMax]}
          onChange={onPriceRange}
        />
      </div>

      {/* Time of Day */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Clock size={13} color="var(--accent-1)" />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Departure Time</span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[{ id: 'all', label: 'All' }, ...TIME_SLOTS].map(slot => (
            <button
              key={slot.id}
              onClick={() => onTimeSlot(slot.id)}
              className={`btn btn-sm ${timeSlot === slot.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.75rem', padding: '3px 10px' }}
            >
              {slot.label}
            </button>
          ))}
        </div>
      </div>

      {/* Airline Checkboxes */}
      {uniqueAirlines.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Plane size={13} color="var(--accent-1)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Airlines</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className={`btn btn-sm ${airlines.length === 0 ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.73rem', padding: '3px 9px' }}
              onClick={() => onAirlines([])}
            >
              All
            </button>
            {uniqueAirlines.map(code => {
              const active = airlines.includes(code);
              return (
                <button
                  key={code}
                  className={`btn btn-sm ${active ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.73rem', padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() =>
                    onAirlines(
                      active ? airlines.filter(a => a !== code) : [...airlines, code]
                    )
                  }
                >
                  <AirlineLogo airlineCode={code} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FlightsTable({ fares, showProvider = false }) {
  const [sortCol, setSortCol]       = useState('total_fare');
  const [sortDir, setSortDir]       = useState('asc');
  const [search, setSearch]         = useState('');
  const [stopsFilter, setStops]     = useState('all');
  const [sourceFilter, setSource]   = useState('all');
  const [page, setPage]             = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Advanced filters
  const [priceRange, setPriceRange] = useState(null);  // null = unset (accept all)
  const [timeSlot, setTimeSlot]     = useState('all');
  const [airlines, setAirlines]     = useState([]);     // empty = all

  const PAGE_SIZE = 20;

  const COLS = showProvider ? [SOURCE_COL, ...BASE_COLS] : BASE_COLS;

  // Compute price bounds from full fare list (not filtered)
  const priceStats = useMemo(() => {
    const prices = (fares || []).map(f => +(f.total_fare || f.base_fare || 0)).filter(Boolean);
    if (!prices.length) return { min: 0, max: 100000 };
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [fares]);

  // Initialise priceRange from data when first available
  const effectivePriceRange = priceRange || [priceStats.min, priceStats.max];

  function handleSort(key) {
    if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(key); setSortDir('asc'); }
    setPage(1);
  }

  function resetAdvancedFilters() {
    setPriceRange(null);
    setTimeSlot('all');
    setAirlines([]);
    setPage(1);
  }

  const hasAdvancedFilter = timeSlot !== 'all' || airlines.length > 0 ||
    (priceRange && (priceRange[0] > priceStats.min || priceRange[1] < priceStats.max));

  const filtered = useMemo(() => {
    let data = [...(fares || [])];

    // Stops filter
    if (stopsFilter !== 'all') {
      const n = +stopsFilter;
      data = n === 2
        ? data.filter(f => f.stops >= 2)
        : data.filter(f => f.stops === n);
    }

    // Source filter (only when showProvider)
    if (showProvider && sourceFilter !== 'all') {
      data = data.filter(f => f.provider === sourceFilter || (sourceFilter === 'google_flights' && f.provider === 'cleartrip'));
    }

    // Text search
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(f =>
        (f.flight_number || '').toLowerCase().includes(q) ||
        (f.airline       || '').toLowerCase().includes(q) ||
        (f.travel_date   || '').includes(q)               ||
        (f.fare_family   || '').toLowerCase().includes(q)
      );
    }

    // ── Advanced filters ──────────────────────────────────────────────────────

    // Price range
    const [pLow, pHigh] = effectivePriceRange;
    data = data.filter(f => {
      const p = +(f.total_fare || f.base_fare || 0);
      return p >= pLow && p <= pHigh;
    });

    // Time of day
    if (timeSlot !== 'all') {
      data = data.filter(f => inTimeSlot(f, timeSlot));
    }

    // Airline checkboxes
    if (airlines.length > 0) {
      data = data.filter(f => {
        const code = (f.airline || '').trim().slice(0, 2).toUpperCase();
        return airlines.includes(code);
      });
    }

    // Sort
    data.sort((a, b) => {
      let va = a[sortCol] ?? '';
      let vb = b[sortCol] ?? '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      return sortDir === 'asc' ? (va < vb ? -1 : va > vb ? 1 : 0)
                               : (va > vb ? -1 : va < vb ? 1 : 0);
    });
    return data;
  }, [fares, sortCol, sortDir, search, stopsFilter, sourceFilter, showProvider,
      effectivePriceRange, timeSlot, airlines]);

  const pages     = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span className="sort-icon">↕</span>;
    return <span className="sort-icon active">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  if (!fares || fares.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><Plane size={48} color="var(--text-muted)" style={{ opacity: 0.5 }} /></div>
        <div className="empty-title">No flights found</div>
        <div className="empty-sub">Run a search above to scrape live fare data.</div>
      </div>
    );
  }

  return (
    <div className="anim-fade">
      {/* ── Basic filter bar ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
        <input
          className="input"
          style={{ maxWidth: 200 }}
          placeholder="Search flight, airline, date…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />

        <select
          className="select"
          style={{ width: 'auto', minWidth: 130 }}
          value={stopsFilter}
          onChange={e => { setStops(e.target.value); setPage(1); }}
        >
          <option value="all">All Stops</option>
          <option value="0">Non-stop</option>
          <option value="1">1 Stop</option>
          <option value="2">2+ Stops</option>
        </select>

        {showProvider && (
          <select
            className="select"
            style={{ width: 'auto', minWidth: 140 }}
            value={sourceFilter}
            onChange={e => { setSource(e.target.value); setPage(1); }}
          >
            <option value="all">All Sources</option>
            <option value="easemytrip">EaseMyTrip</option>
            <option value="google_flights">Google Flights</option>
          </select>
        )}

        {/* Toggle advanced filters */}
        <button
          className={`btn btn-sm ${showFilters || hasAdvancedFilter ? 'btn-primary' : 'btn-ghost'}`}
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          onClick={() => setShowFilters(f => !f)}
        >
          <SlidersHorizontal size={13} />
          Filters
          {hasAdvancedFilter && (
            <span style={{
              background: 'var(--accent-1)', color: '#fff',
              borderRadius: '50%', width: 16, height: 16,
              fontSize: '0.65rem', display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center',
            }}>●</span>
          )}
        </button>

        {hasAdvancedFilter && (
          <button className="btn btn-ghost btn-sm" onClick={resetAdvancedFilters} style={{ fontSize: '0.78rem' }}>
            ✕ Reset
          </button>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="text-sm text-muted" style={{ lineHeight: '36px' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(filtered, COLS)}>⬇ CSV</button>
        </div>
      </div>

      {/* ── Advanced filter panel ─────────────────────────────────────────── */}
      {showFilters && (
        <FilterPanel
          fares={fares}
          priceRange={effectivePriceRange}
          onPriceRange={r => { setPriceRange(r); setPage(1); }}
          timeSlot={timeSlot}
          onTimeSlot={s => { setTimeSlot(s); setPage(1); }}
          airlines={airlines}
          onAirlines={a => { setAirlines(a); setPage(1); }}
        />
      )}

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {COLS.map(col => (
                <th
                  key={col.key}
                  style={{ width: col.width, cursor: col.sortable ? 'pointer' : 'default' }}
                  className={sortCol === col.key ? 'sorted' : ''}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  {col.label}{col.sortable && <SortIcon col={col.key} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((f, i) => (
              <tr key={i}>
                {showProvider && (
                  <td><ProviderBadge provider={f.provider} /></td>
                )}
                <td>
                  <strong className="font-mono" style={{ fontSize: '0.85rem' }}>{f.flight_number}</strong>
                </td>
                <td><AirlineLogo airlineCode={f.airline} /></td>
                <td>{f.travel_date}</td>
                <td className="font-mono">{fmtT(f.departure_datetime)}</td>
                <td className="font-mono">{fmtT(f.arrival_datetime)}</td>
                <td className="text-secondary">{fmtD(f.duration_minutes)}</td>
                <td><StopsBadge stops={f.stops} /></td>
                <td className="text-muted" style={{ fontSize: '0.8rem' }}>{f.fare_family || '—'}</td>
                <td><CabinBadge cabin={f.cabin_class} /></td>
                <td className="price price-base">{fmt(f.base_fare)}</td>
                <td className="price price-tax">{fmt(f.taxes)}</td>
                <td className="price price-total">{fmt(f.total_fare)}</td>
                <td><StatusBadge status={f.validation_status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {pages > 1 && (
        <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
          <span className="text-sm text-muted">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
            {Array.from({ length: Math.min(5, pages) }, (_, i) => {
              const p = Math.max(1, Math.min(pages - 4, page - 2)) + i;
              return (
                <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPage(p)}>{p}</button>
              );
            })}
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

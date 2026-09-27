/**
 * CompareTable — side-by-side EMT vs CT price comparison.
 * Matches flights by (flight_number + travel_date).
 * Shows one row per unique flight with both source prices, diff, and a cheaper badge.
 */
import { useMemo, useState } from 'react';
import { AirlineLogo } from './Logos';
import { Scale } from 'lucide-react';

const fmt = n => n != null ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—';
const fmtT = dt => dt ? dt.slice(11, 16) : '—';
const fmtD = m => m != null ? `${Math.floor(m / 60)}h ${m % 60}m` : '—';

function CheaperBadge({ emt, ct }) {
  if (emt == null && ct == null) return null;
  if (emt == null) return <span className="badge badge-amber">GF only</span>;
  if (ct  == null) return <span className="badge badge-blue">EMT only</span>;
  if (emt < ct)   return <span className="badge badge-green">EMT cheaper</span>;
  if (ct  < emt)  return <span className="badge badge-green">GF cheaper</span>;
  return <span className="badge badge-amber">Same price</span>;
}

function DiffCell({ emt, ct }) {
  if (emt == null || ct == null) return <td className="text-muted">—</td>;
  const diff = ct - emt;
  const color = diff > 0 ? 'var(--green)' : diff < 0 ? 'var(--red)' : 'var(--text-muted)';
  const sign  = diff > 0 ? '+' : '';
  return (
    <td style={{ color, fontWeight: 600 }}>
      {sign}{fmt(Math.abs(diff))}
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 4 }}>
        {diff > 0 ? 'GF costlier' : diff < 0 ? 'EMT costlier' : ''}
      </span>
    </td>
  );
}

export default function CompareTable({ emtFlights, ctFlights }) {
  const [sortCol, setSortCol] = useState('emt_total');
  const [sortDir, setSortDir] = useState('asc');
  const [search, setSearch]   = useState('');
  const [filterMode, setFilterMode] = useState('matched'); // 'all' | 'matched' | 'emt' | 'ct'

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

  const SortIcon = ({ col }) => (
    <span className="sort-icon">
      {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  // ── Build merged rows ──────────────────────────────────────────────────────
  const rows = useMemo(() => {
    const emtMap = new Map();
    const ctMap  = new Map();

    for (const f of (emtFlights || [])) {
      const key = `${f.flight_number}__${f.travel_date}`;
      if (!emtMap.has(key) || f.total_fare < emtMap.get(key).total_fare) {
        emtMap.set(key, f);
      }
    }
    for (const f of (ctFlights || [])) {
      const key = `${f.flight_number}__${f.travel_date}`;
      if (!ctMap.has(key) || f.total_fare < ctMap.get(key).total_fare) {
        ctMap.set(key, f);
      }
    }

    const allKeys = new Set([...emtMap.keys(), ...ctMap.keys()]);
    const result = [];

    for (const key of allKeys) {
      const emt = emtMap.get(key) || null;
      const ct  = ctMap.get(key)  || null;
      const ref = emt || ct;

      result.push({
        key,
        flight_number:      ref.flight_number,
        airline:            ref.airline,
        travel_date:        ref.travel_date,
        departure_datetime: ref.departure_datetime,
        arrival_datetime:   ref.arrival_datetime,
        duration_minutes:   ref.duration_minutes,
        stops:              ref.stops,
        emt_total:          emt?.total_fare ?? null,
        emt_base:           emt?.base_fare  ?? null,
        emt_tax:            emt?.taxes      ?? null,
        ct_total:           ct?.total_fare  ?? null,
        ct_base:            ct?.base_fare   ?? null,
        ct_tax:             ct?.taxes       ?? null,
      });
    }

    return result;
  }, [emtFlights, ctFlights]);

  // ── Summary stats ──────────────────────────────────────────────────────────
  const matched   = rows.filter(r => r.emt_total != null && r.ct_total != null);
  const emtWins   = matched.filter(r => r.emt_total < r.ct_total).length;
  const ctWins    = matched.filter(r => r.ct_total  < r.emt_total).length;
  const avgSaving = matched.length
    ? matched.reduce((s, r) => s + Math.abs(r.emt_total - r.ct_total), 0) / matched.length
    : 0;

  // ── Filter + sort ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let data = [...rows];

    if (filterMode === 'matched') {
      data = data.filter(r => r.emt_total != null && r.ct_total != null);
    } else if (filterMode === 'emt') {
      data = data.filter(r => r.emt_total != null && r.ct_total != null && r.emt_total < r.ct_total);
    } else if (filterMode === 'ct') {
      data = data.filter(r => r.emt_total != null && r.ct_total != null && r.ct_total < r.emt_total);
    }

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(r =>
        r.flight_number.toLowerCase().includes(q) ||
        r.airline.toLowerCase().includes(q) ||
        r.travel_date.includes(q)
      );
    }
    data.sort((a, b) => {
      const va = a[sortCol] ?? (sortDir === 'asc' ? Infinity : -Infinity);
      const vb = b[sortCol] ?? (sortDir === 'asc' ? Infinity : -Infinity);
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return data;
  }, [rows, search, sortCol, sortDir, filterMode]);

  if (!rows.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><Scale size={48} color="var(--text-muted)" style={{ opacity: 0.5 }} /></div>
        <div className="empty-title">Not enough data to compare</div>
        <div className="empty-sub">Run a search in Dual Source mode to compare EaseMyTrip vs Google Flights prices.</div>
      </div>
    );
  }

  return (
    <div className="anim-fade">
      {/* Mini summary strip — clickable to filter */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          className="glass"
          onClick={() => setFilterMode(filterMode === 'matched' ? 'all' : 'matched')}
          style={{
            padding: '10px 18px', borderRadius: 10, flex: 1, minWidth: 140, textAlign: 'left',
            cursor: 'pointer', border: filterMode === 'matched' ? '2px solid var(--accent-1)' : undefined,
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>MATCHED FLIGHTS</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{matched.length}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 6 }}>/ {rows.length} total</span>
          </div>
        </button>

        <button
          className="glass"
          onClick={() => setFilterMode(filterMode === 'emt' ? 'all' : 'emt')}
          style={{
            padding: '10px 18px', borderRadius: 10, flex: 1, minWidth: 140, textAlign: 'left',
            cursor: 'pointer', border: filterMode === 'emt' ? '2px solid var(--accent-1)' : undefined,
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>EMT CHEAPER</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-1)' }}>{emtWins}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 6 }}>flights</span>
          </div>
        </button>

        <button
          className="glass"
          onClick={() => setFilterMode(filterMode === 'ct' ? 'all' : 'ct')}
          style={{
            padding: '10px 18px', borderRadius: 10, flex: 1, minWidth: 140, textAlign: 'left',
            cursor: 'pointer', border: filterMode === 'ct' ? '2px solid var(--amber)' : undefined,
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>GF CHEAPER</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--amber)' }}>{ctWins}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 6 }}>flights</span>
          </div>
        </button>

        <div className="glass" style={{ padding: '10px 18px', borderRadius: 10, flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>AVG PRICE DIFF</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--green)' }}>{fmt(avgSaving)}</div>
        </div>
      </div>

      {/* Filter tabs & Search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          className="input"
          style={{ maxWidth: 220 }}
          placeholder="Search flight, airline…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="tab-bar" style={{ flex: 'none' }}>
          <button
            className={`tab-btn ${filterMode === 'matched' ? 'active' : ''}`}
            onClick={() => setFilterMode('matched')}
          >
            Matched ({matched.length})
          </button>
          <button
            className={`tab-btn ${filterMode === 'all' ? 'active' : ''}`}
            onClick={() => setFilterMode('all')}
          >
            All ({rows.length})
          </button>
          {ctWins > 0 && (
            <button
              className={`tab-btn ${filterMode === 'ct' ? 'active' : ''}`}
              onClick={() => setFilterMode('ct')}
            >
              GF Cheaper ({ctWins})
            </button>
          )}
          {emtWins > 0 && (
            <button
              className={`tab-btn ${filterMode === 'emt' ? 'active' : ''}`}
              onClick={() => setFilterMode('emt')}
            >
              EMT Cheaper ({emtWins})
            </button>
          )}
        </div>
        <span className="text-sm text-muted" style={{ marginLeft: 'auto' }}>
          {filtered.length} flight{filtered.length !== 1 ? 's' : ''} shown
        </span>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 120 }}>Flight</th>
              <th style={{ width: 80 }}>Airline</th>
              <th onClick={() => handleSort('travel_date')} style={{ cursor: 'pointer', width: 110 }}>
                Date <SortIcon col="travel_date" />
              </th>
              <th style={{ width: 60 }}>Dep</th>
              <th style={{ width: 60 }}>Dur</th>
              <th style={{ width: 60 }}>Stops</th>
              {/* EMT columns */}
              <th
                onClick={() => handleSort('emt_base')}
                style={{ cursor: 'pointer', background: 'rgba(37,99,235,0.05)', width: 100 }}
              >
                EMT Base <SortIcon col="emt_base" />
              </th>
              <th style={{ background: 'rgba(37,99,235,0.05)', width: 90 }}>EMT Tax</th>
              <th
                onClick={() => handleSort('emt_total')}
                style={{ cursor: 'pointer', background: 'rgba(37,99,235,0.1)', fontWeight: 700, width: 110, color: 'var(--accent-2)' }}
              >
                EMT Total <SortIcon col="emt_total" />
              </th>
              {/* GF columns */}
              <th
                onClick={() => handleSort('ct_base')}
                style={{ cursor: 'pointer', background: 'rgba(5,150,105,0.05)', width: 100 }}
              >
                GF Base <SortIcon col="ct_base" />
              </th>
              <th style={{ background: 'rgba(5,150,105,0.05)', width: 90 }}>GF Tax</th>
              <th
                onClick={() => handleSort('ct_total')}
                style={{ cursor: 'pointer', background: 'rgba(5,150,105,0.1)', fontWeight: 700, width: 110, color: 'var(--green)' }}
              >
                GF Total <SortIcon col="ct_total" />
              </th>
              {/* Diff */}
              <th style={{ width: 130 }}>Diff (GF−EMT)</th>
              <th style={{ width: 110 }}>Verdict</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.key}>
                <td><strong className="font-mono">{r.flight_number}</strong></td>
                <td><AirlineLogo airlineCode={r.airline} /></td>
                <td>{r.travel_date}</td>
                <td className="font-mono">{fmtT(r.departure_datetime)}</td>
                <td className="text-secondary">{fmtD(r.duration_minutes)}</td>
                <td>{r.stops === 0 ? <span className="badge badge-green">Non-stop</span> : <span className="badge badge-amber">{r.stops} Stop</span>}</td>
                {/* EMT */}
                <td style={{ background: 'rgba(37,99,235,0.02)' }} className="price price-base">{fmt(r.emt_base)}</td>
                <td style={{ background: 'rgba(37,99,235,0.02)' }} className="price price-tax">{fmt(r.emt_tax)}</td>
                <td style={{ background: 'rgba(37,99,235,0.06)', fontWeight: 700, color: 'var(--accent-2)' }} className="price price-total">{fmt(r.emt_total)}</td>
                {/* CT */}
                <td style={{ background: 'rgba(5,150,105,0.02)' }} className="price price-base">{fmt(r.ct_base)}</td>
                <td style={{ background: 'rgba(5,150,105,0.02)' }} className="price price-tax">{fmt(r.ct_tax)}</td>
                <td style={{ background: 'rgba(5,150,105,0.06)', fontWeight: 700, color: 'var(--green)' }} className="price price-total">{fmt(r.ct_total)}</td>
                {/* Diff */}
                <DiffCell emt={r.emt_total} ct={r.ct_total} />
                <td><CheaperBadge emt={r.emt_total} ct={r.ct_total} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

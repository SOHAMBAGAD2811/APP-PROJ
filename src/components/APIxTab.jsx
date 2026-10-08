import { useState, useEffect, useCallback, Component } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
  BarChart, Bar, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle, Database,
  Info, ShieldCheck, ChevronDown, ChevronUp, BookOpen, CheckCircle2,
  Clock, Layers, ExternalLink, Map as MapIcon, BarChart2, FlaskConical,
  Download, FileText,
} from 'lucide-react';
import SimulatorCard  from './SimulatorCard';
import RouteHeatmap   from './RouteHeatmap';
import LeadTimeCurve  from './LeadTimeCurve';
import BacktestCard   from './BacktestCard';
import APIxFilters    from './APIxFilters';
import CorridorGrid   from './CorridorGrid';

// ── Error Boundary ─────────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-sm" style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <strong>⚠️ {this.props.name || 'Component'} failed to load:</strong>{' '}
          {this.state.error?.message || 'Unknown error'}
        </div>
      );
    }
    return this.props.children;
  }
}


// ── Formatters ─────────────────────────────────────────────────────────────────
const INR = n =>
  n == null ? '—' : `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const fmt = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

function formatFreshness(mins) {
  if (mins == null) return 'No data';
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hrs < 24) return `${hrs}h ${rem}m ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ── APIx score colour helper ───────────────────────────────────────────────────
// 100 = baseline (neutral), >100 = expensive (red), <100 = cheap (green)
function apixColor(v) {
  if (v == null) return 'var(--text-muted)';
  if (v >= 115)  return '#f87171';   // significantly above baseline
  if (v >= 105)  return '#fb923c';   // slightly above
  if (v <= 85)   return '#4ade80';   // significantly below baseline
  if (v <= 95)   return '#86efac';   // slightly below
  return 'var(--accent-1)';          // near 100 — neutral
}

function apixLabel(v) {
  if (v == null) return 'No data';
  if (v >= 115)  return 'Much more expensive than baseline';
  if (v >= 105)  return 'Slightly above baseline';
  if (v <= 85)   return 'Much cheaper than baseline';
  if (v <= 95)   return 'Slightly below baseline';
  return 'At baseline — fares are stable';
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
const ApixTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload || {};
  return (
    <div className="glass-sm" style={{ padding: '10px 14px', fontSize: '0.82rem', minWidth: 220, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 600 }}>
            {p.dataKey === 'apix' || p.dataKey === 'national_apix'
              ? (p.value != null ? p.value.toFixed(1) : '—')
              : INR(p.value)}
          </span>
        </div>
      ))}
      {d.basket_coverage_pct != null && (
        <div style={{ marginTop: 6, color: 'var(--text-muted)', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 6 }}>
          DGCA Basket Coverage: <strong>{d.basket_coverage_pct}%</strong> ({d.active_corridors_count} corridors)
        </div>
      )}
      {d.sample_count != null && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Samples in bucket: {d.sample_count}
        </div>
      )}
    </div>
  );
};

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, trend }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'var(--red)' : trend === 'down' ? '#4ade80' : 'var(--text-muted)';
  return (
    <div className="glass-sm" style={{ padding: '16px 20px', flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: color || 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        {value}
        {trend && <TrendIcon size={16} color={trendColor} />}
      </div>
      {sub && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── APIx Hero gauge ────────────────────────────────────────────────────────────
function ApixHero({ apix, baseAvg, isNational = true, corridorName = null }) {
  const color = apixColor(apix);
  const label = apixLabel(apix);
  const clampedAngle = apix == null ? 90 : Math.min(180, Math.max(0, ((apix - 50) / 100) * 180));

  return (
    <div className="glass-sm" style={{
      padding: '24px 28px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      flex: '0 0 auto',
      minWidth: 240,
    }}>
      {/* Semi-circle gauge */}
      <svg width="180" height="100" viewBox="0 0 180 100">
        {[
          { start: 0,   end: 60,  color: '#4ade80' },  // cheap
          { start: 60,  end: 108, color: '#86efac' },  // below
          { start: 108, end: 126, color: 'var(--accent-1)' }, // neutral
          { start: 126, end: 156, color: '#fb923c' },  // above
          { start: 156, end: 180, color: '#f87171' },  // expensive
        ].map(({ start, end, color: sc }, i) => {
          const toRad = deg => (Math.PI / 180) * (180 - deg);
          const r = 78, cx = 90, cy = 92;
          const x1 = cx + r * Math.cos(toRad(start));
          const y1 = cy - r * Math.sin(toRad(start));
          const x2 = cx + r * Math.cos(toRad(end));
          const y2 = cy - r * Math.sin(toRad(end));
          const large = end - start > 90 ? 1 : 0;
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2}`}
              fill="none"
              stroke={sc}
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.75"
            />
          );
        })}
        {/* Needle */}
        {apix != null && (() => {
          const r = 60, cx = 90, cy = 92;
          const rad = (Math.PI / 180) * (180 - clampedAngle);
          const nx = cx + r * Math.cos(rad);
          const ny = cy - r * Math.sin(rad);
          return (
            <line
              x1={cx} y1={cy}
              x2={nx} y2={ny}
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
            />
          );
        })()}
        <circle cx="90" cy="92" r="5" fill={color} />
        <text x="8"  y="98" fill="#4ade80" fontSize="9" fontWeight="600">Cheap</text>
        <text x="130" y="98" fill="#f87171" fontSize="9" fontWeight="600">Pricey</text>
      </svg>

      {/* Score */}
      <div style={{ fontSize: '2.8rem', fontWeight: 800, color, lineHeight: 1, marginTop: -8 }}>
        {apix != null ? apix.toFixed(1) : '—'}
      </div>
      <div style={{
        fontSize: '0.72rem',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        color: isNational ? 'var(--accent-1)' : 'var(--text-muted)',
        fontWeight: 700,
      }}>
        {isNational ? 'National DGCA APIx' : `${corridorName || 'Route'} APIx`}
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 190 }}>
        {label}
      </div>
      {baseAvg != null && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
          Baseline: {INR(baseAvg)}
        </div>
      )}
    </div>
  );
}


// ── Main Component ─────────────────────────────────────────────────────────────
export default function APIxTab() {
  const [origin,          setOrigin]          = useState('');
  const [destination,     setDestination]     = useState('');
  const [source,          setSource]          = useState('');
  const [bucket,          setBucket]          = useState('1 day');
  const [daysBack,        setDaysBack]        = useState(30);
  const [baseDays,        setBaseDays]        = useState(7);
  const [data,            setData]            = useState([]);
  const [summary,         setSummary]         = useState(null);
  const [showMethodology, setShowMethodology] = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState(null);
  const [lastFetched,     setLastFetched]     = useState(null);
  const [decompData,      setDecompData]      = useState([]);

  // Fetch corridor decomposition once on mount
  useEffect(() => {
    fetch('/api/apix/decomposition')
      .then(r => r.ok ? r.json() : [])
      .then(d => setDecompData(Array.isArray(d) ? d : []))
      .catch(() => setDecompData([]));
  }, []);


  const fetchApix = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apixParams = new URLSearchParams({
        bucket,
        days_back: daysBack,
        base_days: baseDays,
      });
      if (origin)      apixParams.set('origin', origin);
      if (destination) apixParams.set('destination', destination);
      if (source)      apixParams.set('source', source);

      const summaryParams = new URLSearchParams({
        bucket,
        days_back: daysBack,
        base_days: baseDays,
      });
      if (source) summaryParams.set('source', source);

      // Concurrent fetch of route-level and DGCA national summary
      const [apixRes, summaryRes] = await Promise.all([
        fetch(`/api/apix?${apixParams}`),
        fetch(`/api/apix/summary?${summaryParams}`),
      ]);

      if (apixRes.status === 503 || summaryRes.status === 503) {
        setError('PostgreSQL / TimescaleDB is not running. Start it with: docker compose up -d');
        setData([]);
        setSummary(null);
        return;
      }
      if (!apixRes.ok) throw new Error(`HTTP ${apixRes.status}`);

      const json = await apixRes.json();
      setData(json);

      if (summaryRes.ok) {
        const sumJson = await summaryRes.json();
        setSummary(sumJson);
      }

      setLastFetched(new Date().toLocaleTimeString('en-IN'));
    } catch (e) {
      setError(e.message);
      setData([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [origin, destination, source, bucket, daysBack, baseDays]);

  useEffect(() => { fetchApix(); }, [fetchApix]);

  // Quick corridor filter selection
  const selectCorridor = (corridorCode) => {
    const parts = corridorCode.split('-');
    if (parts.length === 2) {
      if (origin === parts[0] && destination === parts[1]) {
        // toggle off to national
        setOrigin('');
        setDestination('');
      } else {
        setOrigin(parts[0]);
        setDestination(parts[1]);
      }
    }
  };

  const isNationalView = !origin && !destination;

  // ── Derived stats ────────────────────────────────────────────────────────────
  const allAvg     = data.map(d => d.avg_price).filter(Boolean);
  const allMin     = data.map(d => d.min_price).filter(Boolean);
  const allMax     = data.map(d => d.max_price).filter(Boolean);
  const totalSamp  = data.reduce((s, d) => s + (d.sample_count || 0), 0);

  const overallAvg  = allAvg.length  ? allAvg.reduce((a, b) => a + b, 0) / allAvg.length  : null;
  const lowestEver  = allMin.length  ? Math.min(...allMin)  : null;
  const highestEver = allMax.length  ? Math.max(...allMax)  : null;

  // Latest row with valid base
  const latestRow     = data.find(d => d.base_avg != null && d.avg_price != null) || null;
  const latestRouteApix = latestRow?.apix ?? (latestRow?.avg_price && latestRow?.base_avg ? parseFloat(((latestRow.avg_price / latestRow.base_avg) * 100).toFixed(2)) : null);
  const latestBaseAvg = isNationalView ? (summary?.overall_base_avg_fare ?? latestRow?.base_avg) : latestRow?.base_avg;

  // The active score for the hero gauge
  const displayScore = isNationalView ? (summary?.national_apix ?? latestRouteApix) : latestRouteApix;

  // Trend
  let trend = null;
  if (allAvg.length >= 4) {
    const half  = Math.floor(allAvg.length / 2);
    const early = allAvg.slice(0, half).reduce((a, b) => a + b, 0) / half;
    const late  = allAvg.slice(half).reduce((a, b) => a + b, 0) / (allAvg.length - half);
    trend = late > early * 1.02 ? 'up' : late < early * 0.98 ? 'down' : 'flat';
  }

  // Chart data: merge timeseries
  const chartData = (() => {
    if (isNationalView && summary?.timeseries?.length > 0) {
      return summary.timeseries.map(ts => ({
        bucket: ts.bucket,
        label: fmt(ts.bucket),
        avg_price: ts.avg_fare,
        min_price: ts.min_fare,
        max_price: ts.max_fare,
        apix: ts.national_apix,
        sample_count: ts.sample_count,
        basket_coverage_pct: ts.basket_coverage_pct,
        active_corridors_count: ts.active_corridors_count,
      }));
    }

    const map = new Map();
    for (const row of data) {
      const key   = row.bucket;
      const label = fmt(key);
      if (!map.has(key)) map.set(key, { bucket: key, label, sample_count: 0, _apixVals: [], _baseAvgs: [] });
      const e = map.get(key);
      e.avg_price    = e.avg_price   != null ? (e.avg_price + row.avg_price) / 2   : row.avg_price;
      e.min_price    = e.min_price   != null ? Math.min(e.min_price, row.min_price) : row.min_price;
      e.max_price    = e.max_price   != null ? Math.max(e.max_price, row.max_price) : row.max_price;
      e.sample_count += (row.sample_count || 0);
      if (row.base_avg != null) e._baseAvgs.push(row.base_avg);
      if (row.apix != null) e._apixVals.push(row.apix);
    }
    return [...map.values()]
      .sort((a, b) => (a.bucket < b.bucket ? -1 : 1))
      .map(e => ({
        ...e,
        base_avg: e._baseAvgs.length ? e._baseAvgs.reduce((a, b) => a + b, 0) / e._baseAvgs.length : null,
        apix:     e._apixVals.length  ? parseFloat((e._apixVals.reduce((a, b) => a + b, 0) / e._apixVals.length).toFixed(2)) : null,
      }));
  })();

  // Per-route breakdown
  const routeGroups = (() => {
    const map = new Map();
    for (const row of data) {
      const key = `${row.origin ?? '?'}→${row.destination ?? '?'} (${row.source ?? '?'})`;
      if (!map.has(key)) map.set(key, { key, rows: [], origin: row.origin, destination: row.destination, corridor: row.corridor, source: row.source });
      map.get(key).rows.push(row);
    }
    return [...map.values()].map(g => {
      const avgs  = g.rows.map(r => r.avg_price).filter(v => v != null);
      const mins  = g.rows.map(r => r.min_price).filter(v => v != null);
      const maxs  = g.rows.map(r => r.max_price).filter(v => v != null);
      const bases = g.rows.map(r => r.base_avg).filter(v => v != null);
      const recentWithBase = g.rows.find(r => r.apix != null);
      return {
        ...g,
        avg:     avgs.length  ? avgs.reduce((a, b) => a + b, 0) / avgs.length : null,
        min:     mins.length  ? Math.min(...mins) : null,
        max:     maxs.length  ? Math.max(...maxs) : null,
        baseAvg: bases.length ? bases[0] : null,
        apix:    recentWithBase?.apix ?? null,
        samples: g.rows.reduce((s, r) => s + (r.sample_count || 0), 0),
      };
    });
  })();

  const hasData  = chartData.length > 0;
  const noDbMode = error?.includes('not running');

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header with Official Badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
              <Database size={20} color="var(--accent-1)" />
              National Airfare Price Index&nbsp;<span style={{ color: 'var(--accent-1)' }}>(APIx)</span>
            </h2>
            <span style={{
              background: 'var(--accent-light)',
              color: 'var(--accent-2)',
              border: '1px solid #bfdbfe',
              borderRadius: 6,
              padding: '3px 8px',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <ShieldCheck size={13} />
              MoSPI / NSO Prototype • DGCA FY 24–25 Weights
            </span>
          </div>

          {/* Status Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} color="var(--accent-1)" />
              Freshness: <strong style={{ color: 'var(--text-secondary)' }}>{formatFreshness(summary?.freshness_minutes)}</strong>
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Layers size={12} color="#10b981" />
              Basket Traffic Coverage: <strong style={{ color: '#10b981' }}>{summary?.basket_coverage_pct ?? 0}%</strong> ({summary?.active_corridors_count ?? 0}/6 Corridors)
            </span>
            {lastFetched && (
              <>
                <span>•</span>
                <span>Updated: {lastFetched}</span>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <a
            href="/api/export/csv"
            download="aira_apix_dgca.csv"
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', padding: '7px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}
            title="Export clean DGCA corridor dataset as CSV"
          >
            <Download size={14} color="var(--accent-1)" />
            Export CSV
          </a>
          <a
            href="https://drive.google.com/file/d/1E9WFpJxbBOduNnaWg7Gew4w16bxafzlh/view?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', padding: '7px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}
            title="View Official Manual Paper Calculations Document on Google Drive"
          >
            <ExternalLink size={14} color="var(--accent-1)" />
            Manual Calculations (Drive)
          </a>
          <a
            href="/api/export/bulletin"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', padding: '7px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}
            title="View MoSPI-style Statistical Bulletin release"
          >
            <FileText size={14} color="var(--accent-1)" />
            MoSPI Bulletin
          </a>
          <button
            onClick={() => setShowMethodology(!showMethodology)}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', padding: '7px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <BookOpen size={14} color="var(--accent-1)" />
            Methodology &amp; Weights
            {showMethodology ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={fetchApix}
            disabled={loading}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', padding: '7px 14px' }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
            {loading ? 'Loading…' : 'Refresh Index'}
          </button>
        </div>
      </div>

      {/* Collapsible Methodology Card */}
      {showMethodology && (
        <div className="glass-sm anim-fade-in" style={{ padding: '18px 22px', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={16} color="var(--accent-1)" />
                MoSPI / NSO Airfare Price Index (APIx) Methodology Specification
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Designed for high-frequency augmentation of the Consumer Price Index (CPI) 'Transport and Communication' sub-group.
              </div>
            </div>
            <button
              onClick={() => setShowMethodology(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem' }}
            >
              ✕ Close
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, color: 'var(--accent-2)', marginBottom: 6 }}>1. Lowe Price Index Aggregation</div>
              <div>
                Aggregated across observed representative corridors using official fixed passenger traffic weights:
              </div>
              <div style={{ fontFamily: 'monospace', fontWeight: 700, padding: '6px 8px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 4, margin: '8px 0', color: 'var(--text-primary)' }}>
                I_t = 100 × [ Σ (w_i × P_it / P_i0) ] ÷ [ Σ w_i ]
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Where <code>w_i</code> is the corridor passenger share, <code>P_it</code> is current average fare, and <code>P_i0</code> is the baseline reference fare.
              </div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, color: 'var(--accent-2)', marginBottom: 6 }}>2. DGCA Representative Corridor Basket</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: '0.78rem' }}>
                <div>• DEL–BOM: <strong>29.58%</strong> (Delhi – Mumbai)</div>
                <div>• DEL–CCU: <strong>11.96%</strong> (Delhi – Kolkata)</div>
                <div>• DEL–BLR: <strong>20.21%</strong> (Delhi – Bengaluru)</div>
                <div>• MAA–DEL: <strong>10.59%</strong> (Chennai – Delhi)</div>
                <div>• BOM–BLR: <strong>17.76%</strong> (Mumbai – Bengaluru)</div>
                <div>• BLR–HYD: <strong>9.90%</strong> (Bengaluru – Hyderabad)</div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                Source: Directorate General of Civil Aviation (DGCA) FY 2024–25 Scheduled Domestic Traffic.
              </div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, color: 'var(--accent-2)', marginBottom: 6 }}>3. Bidirectional &amp; Baseline Standards</div>
              <div>
                • <strong>Bidirectional Grouping:</strong> E.g. BOM→DEL and DEL→BOM are unified into corridor <code>DEL-BOM</code> to reflect true corridor capacity.
              </div>
              <div style={{ marginTop: 4 }}>
                • <strong>Baseline Anchor:</strong> Base period spans the earliest <code>{baseDays} days</code> of observations in the sample window.
              </div>
              <div style={{ marginTop: 4 }}>
                • <strong>Coverage Transparency:</strong> Observed weights sum to coverage percentage; missing cells are reported explicitly rather than silently assumed.
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
            <ExternalLink size={14} color="var(--accent-1)" />
            <span style={{ color: 'var(--text-muted)' }}>Official Paper Reference:</span>
            <a
              href="https://drive.google.com/file/d/1E9WFpJxbBOduNnaWg7Gew4w16bxafzlh/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-1)', textDecoration: 'underline', fontWeight: 600 }}
            >
              View Manual Paper Calculations Document (Google Drive) ↗
            </a>
          </div>
        </div>
      )}

      {/* DGCA Basket Corridors Card Grid */}
      {summary?.corridors && (
        <CorridorGrid
          corridors={summary.corridors}
          origin={origin}
          destination={destination}
          onSelect={selectCorridor}
          onReset={() => { setOrigin(''); setDestination(''); }}
        />
      )}

      {/* Filter bar */}
      <APIxFilters
        origin={origin}           setOrigin={setOrigin}
        destination={destination} setDestination={setDestination}
        source={source}           setSource={setSource}
        bucket={bucket}           setBucket={setBucket}
        daysBack={daysBack}       setDaysBack={setDaysBack}
        baseDays={baseDays}       setBaseDays={setBaseDays}
        isNationalView={isNationalView}
      />

      {/* Error banner */}
      {error && (
        <div className="glass-sm anim-fade-in" style={{ padding: '14px 18px', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--red)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>APIx calculation error</strong>
            <div style={{ fontSize: '0.85rem', marginTop: 4, opacity: 0.85 }}>{error}</div>
          </div>
        </div>
      )}

      {/* Hero + stat cards row */}
      {!noDbMode && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'stretch' }}>
          {/* Big APIx gauge */}
          <ApixHero
            apix={displayScore}
            baseAvg={latestBaseAvg}
            isNational={isNationalView}
            corridorName={origin && destination ? `${origin}→${destination}` : null}
          />

          {/* Supporting stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <StatCard
                label={isNationalView ? "National Avg Fare" : "Corridor Avg Fare"}
                value={INR(overallAvg)}
                trend={trend}
                sub={trend === 'up' ? 'Prices rising vs baseline' : trend === 'down' ? 'Prices softening' : 'Stable yield'}
              />
              <StatCard
                label="Traffic Coverage"
                value={`${summary?.basket_coverage_pct ?? 0}%`}
                color="#10b981"
                sub={`${summary?.active_corridors_count ?? 0}/6 DGCA Corridors`}
              />
              <StatCard label="Lowest Fare"  value={INR(lowestEver)}  color="#4ade80" />
              <StatCard label="Highest Fare" value={INR(highestEver)} color="#f87171" />
            </div>

            <div className="glass-sm" style={{ padding: '12px 16px', flex: 1 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Economic Index Context
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {isNationalView ? (
                  <>
                    Showing the <strong style={{ color: 'var(--accent-1)' }}>DGCA FY 2024–25 Passenger-Weighted Lowe Index</strong> across representative Indian domestic corridors.
                    A score of <strong style={{ color: 'var(--accent-1)' }}>100.0</strong> represents base-period price parity.
                  </>
                ) : (
                  <>
                    Filtered to corridor <strong style={{ color: 'var(--accent-1)' }}>{origin} ⇄ {destination}</strong>.
                    National DGCA Basket Index is currently at <strong style={{ color: 'var(--accent-1)' }}>{summary?.national_apix?.toFixed(1) ?? '—'}</strong>.
                  </>
                )}
              </div>
              <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {totalSamp} flight quotes evaluated · {routeGroups.length} route pair(s) · base anchor: earliest {baseDays}d
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dual-axis chart: price bars + APIx line */}
      {hasData ? (
        <div className="glass-sm" style={{ padding: '20px 16px 8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {isNationalView ? 'National DGCA APIx & Airfare Trend' : `${origin}→${destination} Fare & APIx Trend`} ({bucket} buckets)
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Left axis: Fare (INR) · Right axis: APIx Score (100 = Baseline)
            </div>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 56, left: 10, bottom: 4 }}>
              <defs>
                <linearGradient id="gradAvg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--accent-1)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--accent-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradMin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                yAxisId="price"
                tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                tickLine={false} axisLine={false}
                width={52}
              />
              <YAxis
                yAxisId="apix"
                orientation="right"
                tickFormatter={v => v.toFixed(0)}
                tick={{ fill: '#fbbf24', fontSize: 11 }}
                tickLine={false} axisLine={false}
                width={40}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<ApixTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: 8 }} />

              <Area yAxisId="price" type="monotone" dataKey="max_price" name="Max Fare" stroke="#f87171" strokeWidth={1.5} fill="none" strokeDasharray="4 3" dot={false} />
              <Area yAxisId="price" type="monotone" dataKey="avg_price" name="Avg Fare" stroke="var(--accent-1)" strokeWidth={2} fill="url(#gradAvg)" dot={false} activeDot={{ r: 5 }} />
              <Area yAxisId="price" type="monotone" dataKey="min_price" name="Min Fare" stroke="#4ade80" strokeWidth={1.5} fill="url(#gradMin)" dot={false} />

              <ReferenceLine yAxisId="apix" y={100} stroke="rgba(251,191,36,0.4)" strokeDasharray="6 3" />
              <Line
                yAxisId="apix"
                type="monotone"
                dataKey="apix"
                name={isNationalView ? "National APIx" : "Route APIx"}
                stroke="#fbbf24"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#fbbf24', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : !loading && !error && (
        <div className="glass-sm" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Database size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No historical quotes in selected window</div>
          <div style={{ fontSize: '0.85rem' }}>
            Execute a flight scrape from the search bar or run a basket sweep to populate TimescaleDB.
          </div>
        </div>
      )}

      {/* Route breakdown table */}
      {routeGroups.length > 0 && (
        <div className="glass-sm" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Route &amp; Corridor Breakdown ({routeGroups.length} observed routes)</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              Deduplicated flight quotes per provider &amp; travel date
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                  {['Route', 'Corridor', 'Source', 'APIx', 'Avg Fare', 'Min Fare', 'Max Fare', 'Baseline', 'Quotes'].map(h => (
                    <th key={h} style={{ padding: '6px 12px', fontWeight: 600, borderBottom: '1px solid rgba(0,0,0,0.06)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {routeGroups.map(g => (
                  <tr key={g.key} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {g.origin ?? '?'} → {g.destination ?? '?'}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--accent-1)', fontWeight: 600 }}>
                      {g.corridor ?? `${g.origin}-${g.destination}`}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        background: g.source === 'emt' ? 'var(--accent-light)' : 'var(--green-bg)',
                        color: g.source === 'emt' ? 'var(--accent-2)' : 'var(--green-text)',
                        border: `1px solid ${g.source === 'emt' ? '#bfdbfe' : 'var(--green-border)'}`,
                        borderRadius: 4, padding: '2px 7px', fontSize: '0.74rem', fontWeight: 600,
                      }}>{g.source?.toUpperCase()}</span>
                    </td>
                    {/* APIx badge */}
                    <td style={{ padding: '8px 12px' }}>
                      {g.apix != null ? (
                        <span style={{
                          background: `${apixColor(g.apix)}22`,
                          color: apixColor(g.apix),
                          borderRadius: 4, padding: '2px 8px', fontSize: '0.82rem', fontWeight: 700,
                        }}>
                          {g.apix.toFixed(1)}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-primary)', fontWeight: 600 }}>{INR(g.avg)}</td>
                    <td style={{ padding: '8px 12px', color: '#16a34a', fontWeight: 600 }}>{INR(g.min)}</td>
                    <td style={{ padding: '8px 12px', color: '#dc2626' }}>{INR(g.max)}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{INR(g.baseAvg)}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{g.samples}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Contribution Decomposition ───────────────────────────────────── */}
      {decompData.length > 0 && (
        <div className="glass-sm" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <BarChart2 size={16} color="var(--accent-1)" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Route Contribution to Index Movement
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 4 }}>
              w_i × (APIx_today − APIx_yesterday) per corridor
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={[...decompData].sort((a, b) => Math.abs(b.contribution ?? 0) - Math.abs(a.contribution ?? 0))}
              layout="vertical"
              margin={{ top: 0, right: 60, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis
                type="number"
                tickFormatter={v => `${v > 0 ? '+' : ''}${v.toFixed(1)}`}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                tickLine={false} axisLine={false}
              />
              <YAxis
                type="category" dataKey="corridor" width={72}
                tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}
                tickLine={false} axisLine={false}
              />
              <Tooltip
                formatter={(val) => [`${val > 0 ? '+' : ''}${Number(val).toFixed(3)}`, 'Contribution']}
                contentStyle={{ fontSize: '0.82rem', borderRadius: 8, border: '1px solid var(--border)' }}
              />
              <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                {decompData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={(entry.contribution ?? 0) > 0 ? '#f87171' : '#4ade80'}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 6 }}>
            🔴 Red = inflationary (pushed index up) &nbsp;|&nbsp; 🟢 Green = deflationary (pushed index down)
          </div>
        </div>
      )}

      {/* ── Route Heatmap ────────────────────────────────────────────────── */}
      <div className="glass-sm" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <MapIcon size={16} color="var(--accent-1)" />
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            DGCA Corridor Network — India Route Map
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 4 }}>
            Line color = corridor APIx · thickness = passenger weight
          </span>
        </div>
        <ErrorBoundary name="Route Heatmap">
          <RouteHeatmap corridors={summary?.corridors || []} />
        </ErrorBoundary>
      </div>

      {/* ── Lead-Time Elasticity ─────────────────────────────────────────── */}
      <ErrorBoundary name="Lead-Time Curve">
        <LeadTimeCurve />
      </ErrorBoundary>

      {/* ── Policy Simulator ─────────────────────────────────────────────── */}
      <ErrorBoundary name="Policy Simulator">
        <SimulatorCard />
      </ErrorBoundary>

      {/* ── Historical Backtesting & eSankhyiki Validation ────────────────── */}
      <ErrorBoundary name="eSankhyiki Validation">
        <BacktestCard />
      </ErrorBoundary>

    </div>
  );
}

import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ScatterChart, Scatter,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
  ReferenceLine,
} from 'recharts';
import {
  SlidersHorizontal, Clock, RotateCcw, TrendingUp,
  Sparkles, Layers, DollarSign, Check, Plane
} from 'lucide-react';
import { getAirlineInfo } from '../utils/airlines';

const INR = n => n != null ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—';
const fmtT = dt => dt ? dt.slice(11, 16) : '—';
const fmtD = m => m != null ? `${Math.floor(m / 60)}h ${m % 60}m` : '—';

// ── Palette Tokens ─────────────────────────────────────────────────────────────
const PALETTE = {
  navy:    '#16435b',
  blue:    '#2563eb',
  emerald: '#10b981',
  amber:   '#f59e0b',
  red:     '#ef4444',
  purple:  '#8b5cf6',
  cyan:    '#06b6d4',
  muted:   '#94a3b8',
  emt:     '#2563eb',
  gf:      '#10b981',
};

const AIRLINE_COLORS = {
  '6E': '#0052cc', // IndiGo Blue
  'AI': '#b91c1c', // Air India Red
  'QP': '#ea580c', // Akasa Orange
  'SG': '#dc2626', // SpiceJet Red
  'IX': '#c2410c', // AI Express
  'UK': '#6b21a8', // Vistara Purple
  'default': '#16435b',
};

// ── Shared Custom Tooltip ──────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-sm anim-fade-in" style={{
      padding: '10px 14px',
      fontSize: '0.82rem',
      background: 'rgba(255, 255, 255, 0.98)',
      boxShadow: '0 8px 24px rgba(22, 67, 91, 0.12)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      minWidth: 160,
    }}>
      {label && <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, margin: '3px 0' }}>
          <span style={{ color: p.color || 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || 'var(--accent)' }} />
            {p.name}:
          </span>
          <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {typeof p.value === 'number' && p.value >= 100 ? INR(p.value) : p.value}
          </strong>
        </div>
      ))}
    </div>
  );
};

// ── Helper: Source detection ───────────────────────────────────────────────────
function detectSources(fares) {
  const sources = new Set((fares || []).map(f => f.provider).filter(Boolean));
  const hasEmt = sources.has('easemytrip');
  const hasGf  = sources.has('cleartrip') || sources.has('google_flights');
  return { hasEmt, hasGf, isMulti: hasEmt && hasGf };
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART 1: Departure Time vs Fare (Hourly Curve & Density)
// ─────────────────────────────────────────────────────────────────────────────
function DepartureTimeFareChart({ fares, metricMode }) {
  const data = useMemo(() => {
    // 2-hour window buckets: 00-02, 02-04, ..., 22-24
    const BUCKETS = [
      { label: '00–04 Early', start: 0, end: 4 },
      { label: '04–07 Dawn', start: 4, end: 7 },
      { label: '07–10 Morning', start: 7, end: 10 },
      { label: '10–13 Midday', start: 10, end: 13 },
      { label: '13–16 Afternoon', start: 13, end: 16 },
      { label: '16–19 Evening', start: 16, end: 19 },
      { label: '19–22 Night', start: 19, end: 22 },
      { label: '22–24 Late', start: 22, end: 24 },
    ];

    return BUCKETS.map(b => {
      const inBucket = fares.filter(f => {
        if (!f.departure_datetime) return false;
        const h = parseInt(f.departure_datetime.slice(11, 13), 10);
        return h >= b.start && h < b.end;
      });

      if (!inBucket.length) {
        return { slot: b.label, fare: null, count: 0, min: null, avg: null };
      }

      const prices = inBucket.map(f => f.total_fare).filter(p => p != null);
      const min = Math.min(...prices);
      const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
      const sorted = [...prices].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];

      const fareVal = metricMode === 'avg' ? avg : metricMode === 'median' ? median : min;

      return {
        slot: b.label,
        fare: fareVal,
        min,
        avg,
        median,
        count: inBucket.length,
      };
    }).filter(d => d.count > 0);
  }, [fares, metricMode]);

  if (!data.length) {
    return <div className="empty-sub" style={{ padding: '40px 0', textAlign: 'center' }}>No departure time data available for selected filters.</div>;
  }

  const metricLabel = metricMode === 'avg' ? 'Average Fare' : metricMode === 'median' ? 'Median Fare' : 'Lowest Fare';

  return (
    <ResponsiveContainer width="100%" height={290}>
      <AreaChart data={data} margin={{ left: 8, right: 16, top: 12, bottom: 4 }}>
        <defs>
          <linearGradient id="timeFareGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={PALETTE.navy} stopOpacity={0.25} />
            <stop offset="95%" stopColor={PALETTE.navy} stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(22, 67, 91, 0.08)" />
        <XAxis dataKey="slot" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
        <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }} />
        <Area
          type="monotone"
          dataKey="fare"
          name={metricLabel}
          stroke={PALETTE.navy}
          fill="url(#timeFareGrad)"
          strokeWidth={2.5}
          dot={{ r: 4, fill: PALETTE.navy }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="count"
          name="Flights Available"
          stroke={PALETTE.amber}
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
          yAxisId={0}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART 2: Airline Price Spread (Min Floor vs Average vs Max Surge)
// ─────────────────────────────────────────────────────────────────────────────
function AirlinePriceSpreadChart({ fares }) {
  const data = useMemo(() => {
    const byAirline = {};
    fares.forEach(f => {
      const code = f.airline || 'Unknown';
      if (!byAirline[code]) {
        byAirline[code] = { airline: code, prices: [], count: 0 };
      }
      if (f.total_fare != null) {
        byAirline[code].prices.push(f.total_fare);
        byAirline[code].count++;
      }
    });

    return Object.values(byAirline)
      .filter(d => d.prices.length > 0)
      .map(d => {
        const sorted = [...d.prices].sort((a, b) => a - b);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const avg = Math.round(sorted.reduce((s, p) => s + p, 0) / sorted.length);
        const { name } = getAirlineInfo(d.airline);
        return {
          airline: name || d.airline,
          rawCode: d.airline,
          min,
          avg,
          max,
          spread: max - min,
          count: d.count,
        };
      })
      .sort((a, b) => a.min - b.min);
  }, [fares]);

  if (!data.length) {
    return <div className="empty-sub" style={{ padding: '40px 0', textAlign: 'center' }}>No airline data to chart.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={290}>
      <BarChart data={data} margin={{ left: 8, right: 16, top: 12, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(22, 67, 91, 0.08)" />
        <XAxis dataKey="airline" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
        <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }} />
        <Bar dataKey="min" name="Starting Fare (Min)" fill={PALETTE.emerald} radius={[4, 4, 0, 0]} />
        <Bar dataKey="avg" name="Average Fare" fill={PALETTE.navy} radius={[4, 4, 0, 0]} />
        <Bar dataKey="max" name="Peak Surge Fare" fill={PALETTE.amber} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART 3: Platform Comparison & Price Delta (EaseMyTrip vs Google Flights)
// ─────────────────────────────────────────────────────────────────────────────
function PlatformComparisonChart({ fares }) {
  const { isMulti } = detectSources(fares);

  const data = useMemo(() => {
    const byAirline = {};
    fares.forEach(f => {
      const code = f.airline || 'Unknown';
      if (!byAirline[code]) {
        byAirline[code] = { airline: code, emtPrices: [], gfPrices: [] };
      }
      if (f.total_fare != null) {
        if (f.provider === 'easemytrip') {
          byAirline[code].emtPrices.push(f.total_fare);
        } else if (f.provider === 'cleartrip' || f.provider === 'google_flights') {
          byAirline[code].gfPrices.push(f.total_fare);
        }
      }
    });

    return Object.values(byAirline)
      .map(d => {
        const emtMin = d.emtPrices.length ? Math.min(...d.emtPrices) : null;
        const gfMin  = d.gfPrices.length ? Math.min(...d.gfPrices) : null;
        const { name } = getAirlineInfo(d.airline);
        return {
          airline: name || d.airline,
          emt: emtMin,
          gf: gfMin,
          diff: (emtMin != null && gfMin != null) ? gfMin - emtMin : null,
        };
      })
      .filter(d => d.emt !== null || d.gf !== null)
      .sort((a, b) => Math.min(a.emt ?? 999999, a.gf ?? 999999) - Math.min(b.emt ?? 999999, b.gf ?? 999999));
  }, [fares]);

  if (!isMulti) {
    // Single source fallback: Top 10 cheapest flights
    const topFlights = [...fares]
      .filter(f => f.total_fare != null)
      .sort((a, b) => a.total_fare - b.total_fare)
      .slice(0, 10)
      .map(f => ({
        flight: f.flight_number,
        fare: Math.round(f.total_fare),
        airline: f.airline,
      }));

    return (
      <ResponsiveContainer width="100%" height={290}>
        <BarChart data={topFlights} layout="vertical" margin={{ left: 16, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(22, 67, 91, 0.08)" />
          <XAxis type="number" tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <YAxis type="category" dataKey="flight" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={80} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="fare" name="Fare" fill={PALETTE.navy} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={290}>
      <BarChart data={data} margin={{ left: 8, right: 16, top: 12, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(22, 67, 91, 0.08)" />
        <XAxis dataKey="airline" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
        <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }} />
        <Bar dataKey="emt" name="EaseMyTrip Min" fill={PALETTE.emt} radius={[4, 4, 0, 0]} />
        <Bar dataKey="gf"  name="Google Flights Min" fill={PALETTE.gf} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART 4: Flight Duration vs Fare Trade-off (Scatter Plot)
// ─────────────────────────────────────────────────────────────────────────────
function DurationVsPriceScatterChart({ fares }) {
  const { isMulti } = detectSources(fares);

  const emtPoints = useMemo(() =>
    fares
      .filter(f => f.duration_minutes && f.total_fare && f.provider === 'easemytrip')
      .map(f => ({
        duration: f.duration_minutes,
        fare: Math.round(f.total_fare),
        flight: f.flight_number,
        airline: f.airline,
        stops: f.stops,
      })),
  [fares]);

  const gfPoints = useMemo(() =>
    fares
      .filter(f => f.duration_minutes && f.total_fare && (f.provider === 'cleartrip' || f.provider === 'google_flights'))
      .map(f => ({
        duration: f.duration_minutes,
        fare: Math.round(f.total_fare),
        flight: f.flight_number,
        airline: f.airline,
        stops: f.stops,
      })),
  [fares]);

  const allPoints = useMemo(() =>
    fares
      .filter(f => f.duration_minutes && f.total_fare)
      .map(f => ({
        duration: f.duration_minutes,
        fare: Math.round(f.total_fare),
        flight: f.flight_number,
        airline: f.airline,
        stops: f.stops,
      })),
  [fares]);

  return (
    <ResponsiveContainer width="100%" height={290}>
      <ScatterChart margin={{ left: 8, right: 16, top: 12, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(22, 67, 91, 0.08)" />
        <XAxis
          dataKey="duration"
          name="Duration"
          unit="m"
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          label={{ value: 'Flight Duration (minutes)', position: 'insideBottomRight', offset: -4, fill: 'var(--text-muted)', fontSize: 10 }}
        />
        <YAxis
          dataKey="fare"
          name="Total Fare"
          tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const pt = payload[0].payload;
            return (
              <div className="glass-sm anim-fade-in" style={{
                padding: '10px 14px',
                fontSize: '0.82rem',
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                boxShadow: '0 8px 24px rgba(22, 67, 91, 0.12)',
              }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{pt.flight} ({pt.airline})</div>
                <div style={{ color: 'var(--text-secondary)', margin: '4px 0' }}>
                  Duration: <strong>{fmtD(pt.duration)}</strong> ({pt.duration}m)
                </div>
                <div style={{ color: 'var(--green)', fontWeight: 700 }}>
                  Fare: {INR(pt.fare)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {pt.stops === 0 ? '✓ Non-stop' : `${pt.stops} Stop(s)`}
                </div>
              </div>
            );
          }}
        />
        <Legend wrapperStyle={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }} />
        {isMulti ? (
          <>
            <Scatter name="EaseMyTrip" data={emtPoints} fill={PALETTE.emt} shape="circle" />
            <Scatter name="Google Flights" data={gfPoints} fill={PALETTE.gf} shape="triangle" />
          </>
        ) : (
          <Scatter name="Flights" data={allPoints} fill={PALETTE.navy} shape="circle" />
        )}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART 5: Price Tier Distribution (Affordability Histogram)
// ─────────────────────────────────────────────────────────────────────────────
function PriceTierDistributionChart({ fares }) {
  const data = useMemo(() => {
    const TIERS = [
      { label: '< ₹6.5k', min: 0, max: 6500 },
      { label: '₹6.5k–₹7.5k', min: 6500, max: 7500 },
      { label: '₹7.5k–₹9k', min: 7500, max: 9000 },
      { label: '₹9k–₹12k', min: 9000, max: 12000 },
      { label: '> ₹12k', min: 12000, max: Infinity },
    ];

    return TIERS.map(t => {
      const matching = fares.filter(f => f.total_fare != null && f.total_fare >= t.min && f.total_fare < t.max);
      return {
        tier: t.label,
        count: matching.length,
        pct: fares.length ? Math.round((matching.length / fares.length) * 100) : 0,
      };
    }).filter(d => d.count > 0);
  }, [fares]);

  return (
    <ResponsiveContainer width="100%" height={290}>
      <BarChart data={data} margin={{ left: 8, right: 16, top: 12, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(22, 67, 91, 0.08)" />
        <XAxis dataKey="tier" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }} />
        <Bar dataKey="count" name="Flight Count" fill={PALETTE.navy} radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === 0 ? PALETTE.emerald : i === data.length - 1 ? PALETTE.amber : PALETTE.navy} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART 6: Fare Component Breakdown (Base vs Taxes & Fees)
// ─────────────────────────────────────────────────────────────────────────────
function FareComponentBreakdownChart({ fares }) {
  const data = useMemo(() => {
    const byAirline = {};
    fares.forEach(f => {
      if (!f.base_fare || !f.taxes) return;
      const code = f.airline || 'Unknown';
      if (!byAirline[code]) {
        byAirline[code] = { airline: code, baseSum: 0, taxSum: 0, count: 0 };
      }
      byAirline[code].baseSum += f.base_fare;
      byAirline[code].taxSum += f.taxes;
      byAirline[code].count++;
    });

    return Object.values(byAirline).map(d => {
      const avgBase = Math.round(d.baseSum / d.count);
      const avgTax  = Math.round(d.taxSum / d.count);
      const { name } = getAirlineInfo(d.airline);
      return {
        airline: name || d.airline,
        base: avgBase,
        taxes: avgTax,
        taxRatio: Math.round((avgTax / (avgBase + avgTax)) * 100),
      };
    }).sort((a, b) => (b.base + b.taxes) - (a.base + a.taxes));
  }, [fares]);

  if (!data.length) {
    return <div className="empty-sub" style={{ padding: '40px 0', textAlign: 'center' }}>No tax breakdown data available.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={290}>
      <BarChart data={data} margin={{ left: 8, right: 16, top: 12, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(22, 67, 91, 0.08)" />
        <XAxis dataKey="airline" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
        <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }} />
        <Bar dataKey="base" name="Base Airfare" stackId="fare" fill={PALETTE.navy} />
        <Bar dataKey="taxes" name="Govt Taxes & Fees" stackId="fare" fill={PALETTE.cyan} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CHART PANEL (Interactive Parameters & Dashboard)
// ─────────────────────────────────────────────────────────────────────────────
export default function ChartPanel({ fares = [] }) {
  // ── Slicing Parameters ───────────────────────────────────────────────────────
  const [selectedAirlines, setSelectedAirlines] = useState([]); // [] = all
  const [stopsFilter, setStopsFilter]           = useState('all'); // 'all' | '0' | '1' | '2+'
  const [timeWindow, setTimeWindow]             = useState('all'); // 'all' | 'early' | 'morning' | 'afternoon' | 'evening'
  const [sourceFilter, setSourceFilter]         = useState('all'); // 'all' | 'easemytrip' | 'google_flights'
  const [metricMode, setMetricMode]             = useState('min'); // 'min' | 'avg' | 'median'
  const [maxPriceCap, setMaxPriceCap]           = useState(null);

  const { isMulti } = detectSources(fares);

  // Extract unique airlines in the dataset with counts
  const airlineList = useMemo(() => {
    const counts = {};
    fares.forEach(f => {
      if (f.airline) counts[f.airline] = (counts[f.airline] || 0) + 1;
    });
    return Object.entries(counts).map(([code, count]) => {
      const info = getAirlineInfo(code);
      return { code, name: info.name || code, count };
    }).sort((a, b) => b.count - a.count);
  }, [fares]);

  // Overall absolute min/max prices
  const [priceBounds, defaultMax] = useMemo(() => {
    const valid = fares.map(f => f.total_fare).filter(p => p != null);
    if (!valid.length) return [[0, 20000], 20000];
    const min = Math.min(...valid);
    const max = Math.max(...valid);
    return [[min, max], max];
  }, [fares]);

  const effectiveMaxPrice = maxPriceCap ?? defaultMax;

  // ── Filtered Flights Pipeline ───────────────────────────────────────────────
  const filteredFares = useMemo(() => {
    return fares.filter(f => {
      // Airline filter
      if (selectedAirlines.length > 0 && !selectedAirlines.includes(f.airline)) {
        return false;
      }
      // Stops filter
      if (stopsFilter !== 'all') {
        if (stopsFilter === '0' && f.stops !== 0) return false;
        if (stopsFilter === '1' && f.stops !== 1) return false;
        if (stopsFilter === '2+' && f.stops < 2) return false;
      }
      // Time window filter
      if (timeWindow !== 'all' && f.departure_datetime) {
        const hh = parseInt(f.departure_datetime.slice(11, 13), 10);
        if (!isNaN(hh)) {
          if (timeWindow === 'early' && hh >= 6) return false;
          if (timeWindow === 'morning' && (hh < 6 || hh >= 12)) return false;
          if (timeWindow === 'afternoon' && (hh < 12 || hh >= 18)) return false;
          if (timeWindow === 'evening' && hh < 18) return false;
        }
      }
      // Source filter
      if (sourceFilter !== 'all') {
        if (sourceFilter === 'easemytrip' && f.provider !== 'easemytrip') return false;
        if (sourceFilter === 'google_flights' && f.provider !== 'google_flights' && f.provider !== 'cleartrip') return false;
      }
      // Max price cap
      if (maxPriceCap && f.total_fare != null && f.total_fare > maxPriceCap) {
        return false;
      }
      return true;
    });
  }, [fares, selectedAirlines, stopsFilter, timeWindow, sourceFilter, maxPriceCap]);

  // Preset handlers
  function applyPreset(type) {
    if (type === 'all') {
      setSelectedAirlines([]);
      setStopsFilter('all');
      setTimeWindow('all');
      setSourceFilter('all');
      setMaxPriceCap(null);
    } else if (type === 'nonstop') {
      setStopsFilter('0');
    } else if (type === 'morning') {
      setTimeWindow('morning');
    } else if (type === 'budget') {
      const target = Math.round(priceBounds[0] * 1.18);
      setMaxPriceCap(target);
    }
  }

  function toggleAirline(code) {
    setSelectedAirlines(curr =>
      curr.includes(code) ? curr.filter(c => c !== code) : [...curr, code]
    );
  }

  const hasActiveFilters = selectedAirlines.length > 0 || stopsFilter !== 'all'
    || timeWindow !== 'all' || sourceFilter !== 'all' || maxPriceCap !== null;

  if (!fares || fares.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><TrendingUp size={48} color="var(--text-muted)" style={{ opacity: 0.5 }} /></div>
        <div className="empty-title">No flight data available to analyze</div>
        <div className="empty-sub">Search for routes or run a basket sweep to view interactive analytics.</div>
      </div>
    );
  }

  return (
    <div className="anim-fade">
      {/* ── Top Interactive Parameter Control Bar ──────────────────────────── */}
      <div className="glass-sm" style={{
        padding: '18px 20px',
        marginBottom: 24,
        borderRadius: 'var(--r-lg)',
        border: '1px solid var(--border)',
        background: '#ffffff',
      }}>
        {/* Row 1: Heading, Presets, and Reset */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 'var(--r-sm)',
              background: 'var(--accent-light)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <SlidersHorizontal size={15} strokeWidth={2.4} />
            </div>
            <div>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Market Analytics Parameters</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                • Interactive graph slicing
              </span>
            </div>
          </div>

          {/* Quick Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Quick Slices:</span>
            <button
              className="btn btn-sm btn-ghost"
              style={{ fontSize: '0.75rem', padding: '3px 9px' }}
              onClick={() => applyPreset('nonstop')}
            >
              Non-stop Only
            </button>
            <button
              className="btn btn-sm btn-ghost"
              style={{ fontSize: '0.75rem', padding: '3px 9px' }}
              onClick={() => applyPreset('morning')}
            >
              Morning (06–12)
            </button>
            <button
              className="btn btn-sm btn-ghost"
              style={{ fontSize: '0.75rem', padding: '3px 9px' }}
              onClick={() => applyPreset('budget')}
            >
              Budget Floor
            </button>
            {hasActiveFilters && (
              <button
                className="btn btn-sm btn-primary"
                style={{ fontSize: '0.75rem', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={() => applyPreset('all')}
              >
                <RotateCcw size={12} /> Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Parameter Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-light)' }}>
          {/* Stops */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>STOPS:</span>
            <div className="tab-bar" style={{ flex: 'none' }}>
              {[
                { id: 'all', label: 'All' },
                { id: '0',   label: 'Non-stop' },
                { id: '1',   label: '1 Stop' },
                { id: '2+',  label: '2+ Stops' },
              ].map(opt => (
                <button
                  key={opt.id}
                  className={`tab-btn ${stopsFilter === opt.id ? 'active' : ''}`}
                  onClick={() => setStopsFilter(opt.id)}
                  style={{ fontSize: '0.75rem', padding: '4px 9px' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Departure Slot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>DEPARTURE:</span>
            <div className="tab-bar" style={{ flex: 'none' }}>
              {[
                { id: 'all',       label: 'All Day' },
                { id: 'early',     label: 'Early (00–06)' },
                { id: 'morning',   label: 'Morning (06–12)' },
                { id: 'afternoon', label: 'Afternoon (12–18)' },
                { id: 'evening',   label: 'Evening (18–24)' },
              ].map(opt => (
                <button
                  key={opt.id}
                  className={`tab-btn ${timeWindow === opt.id ? 'active' : ''}`}
                  onClick={() => setTimeWindow(opt.id)}
                  style={{ fontSize: '0.75rem', padding: '4px 9px' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Metric Mode */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>METRIC:</span>
            <div className="tab-bar" style={{ flex: 'none' }}>
              {[
                { id: 'min',    label: 'Lowest (Min)' },
                { id: 'avg',    label: 'Average' },
                { id: 'median', label: 'Median' },
              ].map(opt => (
                <button
                  key={opt.id}
                  className={`tab-btn ${metricMode === opt.id ? 'active' : ''}`}
                  onClick={() => setMetricMode(opt.id)}
                  style={{ fontSize: '0.75rem', padding: '4px 9px' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Source Filter (when multi-source) */}
          {isMulti && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>PORTAL:</span>
              <div className="tab-bar" style={{ flex: 'none' }}>
                {[
                  { id: 'all',            label: 'Both' },
                  { id: 'easemytrip',     label: 'EaseMyTrip' },
                  { id: 'google_flights', label: 'Google Flights' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    className={`tab-btn ${sourceFilter === opt.id ? 'active' : ''}`}
                    onClick={() => setSourceFilter(opt.id)}
                    style={{ fontSize: '0.75rem', padding: '4px 9px' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Max Price Cap */}
          {priceBounds[1] > priceBounds[0] && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>MAX FARE:</span>
              <input
                type="range"
                min={priceBounds[0]}
                max={priceBounds[1]}
                step={250}
                value={effectiveMaxPrice}
                onChange={e => setMaxPriceCap(Number(e.target.value))}
                style={{ width: 110, accentColor: 'var(--accent)' }}
              />
              <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 700, minWidth: 65 }}>
                {INR(effectiveMaxPrice)}
              </span>
            </div>
          )}
        </div>

        {/* Row 3: Carrier Multi-Select Chips */}
        {airlineList.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 12, paddingTop: 10, borderTop: '1px dashed var(--border-light)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>AIRLINES:</span>
            {airlineList.map(item => {
              const active = selectedAirlines.length === 0 || selectedAirlines.includes(item.code);
              return (
                <button
                  key={item.code}
                  className={`source-pill ${active ? 'active' : ''}`}
                  onClick={() => toggleAirline(item.code)}
                  style={{
                    fontSize: '0.72rem',
                    padding: '3px 10px',
                    borderRadius: 'var(--r-sm)',
                    opacity: active ? 1 : 0.45,
                    border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{item.name}</span>
                  <span style={{ opacity: 0.65, fontSize: '0.65rem', marginLeft: 4 }}>({item.count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Live Filter Indicator Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <div>
            Showing <strong style={{ color: 'var(--accent)' }}>{filteredFares.length}</strong> of <strong>{fares.length}</strong> flight quotes
            {hasActiveFilters && <span style={{ color: 'var(--amber)', marginLeft: 6 }}>• Filter active</span>}
          </div>
          {filteredFares.length > 0 && (
            <div style={{ display: 'flex', gap: 14 }}>
              <span>Filtered Min: <strong style={{ color: 'var(--green)' }}>{INR(Math.min(...filteredFares.map(f => f.total_fare || Infinity)))}</strong></span>
              <span>Filtered Avg: <strong>{INR(Math.round(filteredFares.reduce((s, f) => s + (f.total_fare || 0), 0) / filteredFares.length))}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* ── 6 Rich Analytics Graphs ────────────────────────────────────────── */}
      <div className="chart-grid">
        {/* Chart 1: Time of Day vs Fare */}
        <div className="chart-card">
          <div className="chart-card-title">Departure Window vs Price Curve</div>
          <div className="chart-card-sub">
            {metricMode === 'avg' ? 'Average' : metricMode === 'median' ? 'Median' : 'Lowest'} ticket price by departure time slot
          </div>
          <DepartureTimeFareChart fares={filteredFares} metricMode={metricMode} />
        </div>

        {/* Chart 2: Airline Price Spread (Floor vs Avg vs Surge) */}
        <div className="chart-card">
          <div className="chart-card-title">Carrier Price Spread (Floor · Avg · Surge)</div>
          <div className="chart-card-sub">Min starting fare vs average vs maximum surge fare per airline</div>
          <AirlinePriceSpreadChart fares={filteredFares} />
        </div>

        {/* Chart 3: Platform Comparison (EMT vs Google Flights) */}
        <div className="chart-card">
          <div className="chart-card-title">
            {isMulti ? 'Portal Comparison: EaseMyTrip vs Google Flights' : 'Cheapest Flight Options'}
          </div>
          <div className="chart-card-sub">
            {isMulti ? 'Minimum fare found per airline on each platform' : 'Lowest fares across available flights'}
          </div>
          <PlatformComparisonChart fares={filteredFares} />
        </div>

        {/* Chart 4: Duration vs Price Trade-off (Scatter) */}
        <div className="chart-card">
          <div className="chart-card-title">Duration vs Price Trade-off</div>
          <div className="chart-card-sub">Journey duration (minutes) vs total airfare (INR)</div>
          <DurationVsPriceScatterChart fares={filteredFares} />
        </div>

        {/* Chart 5: Price Tier Distribution */}
        <div className="chart-card">
          <div className="chart-card-title">Affordability Bracket Distribution</div>
          <div className="chart-card-sub">How many flights fall into each fare bracket</div>
          <PriceTierDistributionChart fares={filteredFares} />
        </div>

        {/* Chart 6: Fare Component Split (Base vs Tax) */}
        <div className="chart-card">
          <div className="chart-card-title">Fare Composition (Base Airfare vs Taxes & Fees)</div>
          <div className="chart-card-sub">Portion of ticket going to carrier base fare vs airport/govt charges</div>
          <FareComponentBreakdownChart fares={filteredFares} />
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import {
  CalendarDays, TrendingUp, Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  DollarSign, Clock, Plane, Sparkles, ArrowRight, Check, Info
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
  LineChart, Line, Legend, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { getAirlineInfo } from '../utils/airlines';

const INR = n => n != null ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—';

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

const DOW_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function providerLabel(p) {
  if (p === 'easemytrip') return 'EaseMyTrip';
  if (p === 'cleartrip' || p === 'google_flights') return 'Google Flights';
  return p || '';
}

// ── Shared Tooltip ─────────────────────────────────────────────────────────────
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
      {payload[0]?.payload?.airline && (
        <div style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Carrier: <strong>{payload[0].payload.airline}</strong>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// VIEW 1: Interactive Monthly Calendar Matrix (Heatmap Grid)
// ─────────────────────────────────────────────────────────────────────────────
function CalendarGridMatrix({ data, onSelectDate, selectedDate }) {
  // Extract all distinct year-month strings (e.g. '2026-09', '2026-10')
  const months = useMemo(() => {
    const set = new Set();
    data.forEach(d => {
      if (d.travel_date) set.add(d.travel_date.slice(0, 7));
    });
    return Array.from(set).sort();
  }, [data]);

  const [activeMonth, setActiveMonth] = useState(months[0] || '');

  // Ensure activeMonth is valid
  const currentMonth = months.includes(activeMonth) ? activeMonth : (months[0] || '');

  // Calculate price percentiles for color coding
  const [minFare, p30Fare, p75Fare, maxFare] = useMemo(() => {
    const fares = data.map(d => d.lowest_fare).filter(f => f > 0).sort((a, b) => a - b);
    if (!fares.length) return [0, 0, 0, 0];
    return [
      fares[0],
      fares[Math.floor(fares.length * 0.3)] || fares[0],
      fares[Math.floor(fares.length * 0.75)] || fares[fares.length - 1],
      fares[fares.length - 1],
    ];
  }, [data]);

  // Build dates map for current month
  const monthDates = useMemo(() => {
    if (!currentMonth) return [];
    const [yStr, mStr] = currentMonth.split('-');
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10); // 1-indexed

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 = Sun, 1 = Mon...
    // Convert so Monday = 0, Sunday = 6
    const offset = (firstDayOfWeek + 6) % 7;

    const dataByDay = {};
    data.forEach(d => {
      if (d.travel_date && d.travel_date.startsWith(currentMonth)) {
        const dayNum = parseInt(d.travel_date.slice(8, 10), 10);
        dataByDay[dayNum] = d;
      }
    });

    const cells = [];
    // Padding leading empty cells
    for (let i = 0; i < offset; i++) {
      cells.push({ blank: true });
    }
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const entry = dataByDay[day] || null;
      const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
      cells.push({
        day,
        dateStr,
        fare: entry?.lowest_fare ?? null,
        airline: entry?.airline ?? '',
        provider: entry?.provider ?? '',
        adv: entry?.advance_purchase_days ?? null,
      });
    }
    return cells;
  }, [currentMonth, data]);

  if (!months.length) {
    return <div className="empty-sub" style={{ padding: '30px', textAlign: 'center' }}>No monthly forecast data available.</div>;
  }

  const monthLabel = (mStr) => {
    if (!mStr) return '';
    const [y, m] = mStr.split('-');
    const dt = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return dt.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

  const currMonthIdx = months.indexOf(currentMonth);

  return (
    <div>
      {/* Month Navigator Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="btn btn-sm btn-ghost"
            disabled={currMonthIdx <= 0}
            onClick={() => setActiveMonth(months[currMonthIdx - 1])}
            style={{ padding: '4px 8px' }}
          >
            <ChevronLeft size={16} />
          </button>
          <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', minWidth: 160, textAlign: 'center' }}>
            {monthLabel(currentMonth)}
          </strong>
          <button
            className="btn btn-sm btn-ghost"
            disabled={currMonthIdx >= months.length - 1}
            onClick={() => setActiveMonth(months[currMonthIdx + 1])}
            style={{ padding: '4px 8px' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--green-bg)', border: '1px solid var(--green)' }} />
            Lowest Fares (&lt; {INR(p30Fare)})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
            Standard Market
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--amber-bg)', border: '1px solid var(--amber)' }} />
            Peak Fares (&gt; {INR(p75Fare)})
          </span>
        </div>
      </div>

      {/* Grid Header (DOW) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 6,
        marginBottom: 6,
        textAlign: 'center',
      }}>
        {DOW_ORDER.map(d => (
          <div key={d} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '4px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid Days */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 6,
      }}>
        {monthDates.map((cell, idx) => {
          if (cell.blank) {
            return <div key={`blank-${idx}`} style={{ opacity: 0.15, minHeight: 70 }} />;
          }

          const isBest = cell.fare && cell.fare <= p30Fare;
          const isHigh = cell.fare && cell.fare >= p75Fare;
          const isSelected = selectedDate === cell.dateStr;

          const cellBg = isSelected
            ? 'var(--accent-light)'
            : isBest
            ? 'var(--green-bg)'
            : isHigh
            ? 'var(--amber-bg)'
            : 'var(--bg-card)';

          const cellBorder = isSelected
            ? '2px solid var(--accent)'
            : isBest
            ? '1px solid var(--green-border)'
            : isHigh
            ? '1px solid var(--amber-border)'
            : '1px solid var(--border)';

          return (
            <div
              key={cell.dateStr}
              onClick={() => cell.fare && onSelectDate?.(cell)}
              style={{
                minHeight: 72,
                padding: '8px 10px',
                borderRadius: 'var(--r-sm)',
                background: cellBg,
                border: cellBorder,
                cursor: cell.fare ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={e => { if (cell.fare) e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { if (cell.fare) e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{cell.day}</span>
                {cell.adv != null && (
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>T+{cell.adv}</span>
                )}
              </div>

              {cell.fare ? (
                <div>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: isBest ? 'var(--green-text)' : isHigh ? 'var(--amber-text)' : 'var(--text-primary)',
                  }}>
                    {INR(cell.fare)}
                  </div>
                  {cell.airline && (
                    <div style={{
                      fontSize: '0.65rem',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {cell.airline}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', opacity: 0.5 }}>—</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW 2: Day of Week Dynamics Bar Chart
// ─────────────────────────────────────────────────────────────────────────────
function DayOfWeekDynamicsChart({ data }) {
  const dowStats = useMemo(() => {
    const map = {};
    DOW_ORDER.forEach(d => { map[d] = []; });

    data.forEach(d => {
      if (!d.travel_date || !d.lowest_fare) return;
      const dt = new Date(d.travel_date + 'T00:00:00');
      const dowIdx = (dt.getDay() + 6) % 7; // Monday = 0
      const dow = DOW_ORDER[dowIdx];
      if (map[dow]) map[dow].push(d.lowest_fare);
    });

    return DOW_ORDER.map(day => {
      const fares = map[day] || [];
      if (!fares.length) return { day, avg: null, min: null, count: 0 };
      const avg = Math.round(fares.reduce((s, f) => s + f, 0) / fares.length);
      const min = Math.min(...fares);
      return { day, avg, min, count: fares.length };
    }).filter(d => d.count > 0);
  }, [data]);

  const cheapestDay = useMemo(() => {
    if (!dowStats.length) return null;
    return [...dowStats].sort((a, b) => (a.avg || 999999) - (b.avg || 999999))[0];
  }, [dowStats]);

  const priciestDay = useMemo(() => {
    if (!dowStats.length) return null;
    return [...dowStats].sort((a, b) => (b.avg || 0) - (a.avg || 0))[0];
  }, [dowStats]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Statistically, <strong style={{ color: 'var(--green)' }}>{cheapestDay?.day} departures</strong> average{' '}
          <strong style={{ color: 'var(--green)' }}>{INR(cheapestDay?.avg)}</strong> (cheapest day), whereas{' '}
          <strong style={{ color: 'var(--red)' }}>{priciestDay?.day}</strong> averages{' '}
          <strong style={{ color: 'var(--red)' }}>{INR(priciestDay?.avg)}</strong>.
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={dowStats} margin={{ left: 8, right: 16, top: 12, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(22, 67, 91, 0.08)" />
          <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }} />
          <Bar dataKey="avg" name="Average Fare" fill={PALETTE.navy} radius={[4, 4, 0, 0]}>
            {dowStats.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.day === cheapestDay?.day ? PALETTE.emerald : entry.day === priciestDay?.day ? PALETTE.amber : PALETTE.navy}
              />
            ))}
          </Bar>
          <Bar dataKey="min" name="Lowest Single Fare" fill={PALETTE.cyan} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW 3: Advance Purchase Curve (Lead Time T+1 to T+90)
// ─────────────────────────────────────────────────────────────────────────────
function AdvancePurchaseCurveChart({ data }) {
  const chartData = useMemo(() => {
    const BUCKETS = [
      { label: 'T+1–T+3 (Immediate)', min: 1, max: 3 },
      { label: 'T+4–T+7 (1 Week)', min: 4, max: 7 },
      { label: 'T+8–T+14 (2 Weeks)', min: 8, max: 14 },
      { label: 'T+15–T+30 (1 Month)', min: 15, max: 30 },
      { label: 'T+31–T+60 (2 Months)', min: 31, max: 60 },
      { label: 'T+61–T+90 (3 Months)', min: 61, max: 90 },
    ];

    return BUCKETS.map(b => {
      const inBucket = data.filter(d => d.advance_purchase_days != null && d.advance_purchase_days >= b.min && d.advance_purchase_days <= b.max && d.lowest_fare);
      if (!inBucket.length) return { bucket: b.label, avg: null, min: null, count: 0 };
      const avg = Math.round(inBucket.reduce((s, d) => s + d.lowest_fare, 0) / inBucket.length);
      const min = Math.min(...inBucket.map(d => d.lowest_fare));
      return { bucket: b.label, avg, min, count: inBucket.length };
    }).filter(d => d.count > 0);
  }, [data]);

  return (
    <div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
        How advance booking impacts fare pricing across forward booking windows.
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ left: 8, right: 16, top: 12, bottom: 4 }}>
          <defs>
            <linearGradient id="advGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={PALETTE.blue} stopOpacity={0.25} />
              <stop offset="95%" stopColor={PALETTE.blue} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(22, 67, 91, 0.08)" />
          <XAxis dataKey="bucket" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
          <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }} />
          <Area type="monotone" dataKey="avg" name="Average Fare" stroke={PALETTE.blue} fill="url(#advGrad)" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="min" name="Minimum Fare" stroke={PALETTE.emerald} strokeWidth={2} dot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW 4: Carrier Low-Fare Dominance (Market Share of Lowest Dates)
// ─────────────────────────────────────────────────────────────────────────────
function CarrierDominanceChart({ data }) {
  const chartData = useMemo(() => {
    const counts = {};
    data.forEach(d => {
      const carrier = d.airline || 'Unknown';
      counts[carrier] = (counts[carrier] || 0) + 1;
    });

    const PIE_COLORS = [PALETTE.navy, PALETTE.blue, PALETTE.amber, PALETTE.emerald, PALETTE.purple, PALETTE.cyan];

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], i) => ({
        name,
        value: count,
        color: PIE_COLORS[i % PIE_COLORS.length],
        pct: data.length ? Math.round((count / data.length) * 100) : 0,
      }));
  }, [data]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 24, padding: '10px 0' }}>
      <div style={{ width: 280, height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Lowest Fare Days Share
        </div>
        {chartData.map(c => (
          <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: '0.85rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.color }} />
              <strong style={{ color: 'var(--text-primary)' }}>{c.name}</strong>
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              {c.value} days ({c.pct}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN FARE CALENDAR COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function CalendarChart({ data = [] }) {
  const [activeTab, setActiveTab]         = useState('trend'); // 'trend' | 'matrix' | 'dow' | 'advance' | 'dominance'
  const [sourceFilter, setSourceFilter]   = useState('all'); // 'all' | 'easemytrip' | 'google_flights'
  const [selectedCell, setSelectedCell]   = useState(null);

  const providers = useMemo(() => [...new Set((data || []).map(d => d.provider).filter(Boolean))], [data]);
  const hasGf     = providers.includes('cleartrip') || providers.includes('google_flights');
  const isMulti   = providers.includes('easemytrip') && hasGf;

  // Filtered dataset by portal
  const filteredData = useMemo(() => {
    if (!data || !data.length) return [];
    if (sourceFilter === 'easemytrip') {
      return data.filter(d => d.provider === 'easemytrip');
    }
    if (sourceFilter === 'google_flights') {
      return data.filter(d => d.provider === 'google_flights' || d.provider === 'cleartrip');
    }
    return data;
  }, [data, sourceFilter]);

  // Overall key metrics
  const stats = useMemo(() => {
    if (!data.length) return null;
    const validFares = data.map(d => d.lowest_fare).filter(f => f > 0);
    if (!validFares.length) return null;

    const minFare = Math.min(...validFares);
    const maxFare = Math.max(...validFares);
    const avgFare = Math.round(validFares.reduce((s, f) => s + f, 0) / validFares.length);
    const cheapestEntry = data.find(d => d.lowest_fare === minFare);

    return {
      minFare,
      maxFare,
      avgFare,
      cheapestEntry,
      datesCount: new Set(data.map(d => d.travel_date)).size,
    };
  }, [data]);

  // Unified trend data for the continuous horizon line
  const trendLineData = useMemo(() => {
    if (isMulti) {
      const emtMap = {};
      const gfMap  = {};
      data.forEach(d => {
        const date = d.travel_date?.slice(5) || '';
        if (!date || !d.lowest_fare) return;
        const fare = Math.round(d.lowest_fare);
        if (d.provider === 'easemytrip') {
          if (!emtMap[date] || fare < emtMap[date].fare) emtMap[date] = { date, fullDate: d.travel_date, fare, airline: d.airline };
        } else if (d.provider === 'cleartrip' || d.provider === 'google_flights') {
          if (!gfMap[date]  || fare < gfMap[date].fare)  gfMap[date]  = { date, fullDate: d.travel_date, fare, airline: d.airline };
        }
      });
      const allDates = [...new Set([...Object.keys(emtMap), ...Object.keys(gfMap)])].sort();
      return allDates.map(d => ({
        date:     d,
        fullDate: emtMap[d]?.fullDate || gfMap[d]?.fullDate,
        emt:      emtMap[d]?.fare ?? null,
        gf:       gfMap[d]?.fare  ?? null,
        airline:  emtMap[d]?.airline || gfMap[d]?.airline || '',
      }));
    } else {
      const map = {};
      filteredData.forEach(d => {
        const date = d.travel_date?.slice(5) || '';
        if (!date || !d.lowest_fare) return;
        const fare = Math.round(d.lowest_fare);
        if (!map[date] || fare < map[date].fare) {
          map[date] = {
            date,
            fullDate: d.travel_date,
            fare,
            airline: d.airline || '',
            adv: d.advance_purchase_days,
          };
        }
      });
      return Object.values(map).sort((a, b) => (a.fullDate || '').localeCompare(b.fullDate || ''));
    }
  }, [data, filteredData, isMulti]);

  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><CalendarDays size={48} color="var(--text-muted)" style={{ opacity: 0.5 }} /></div>
        <div className="empty-title">No Fare Calendar Data</div>
        <div className="empty-sub">Enable the fare calendar toggle before searching to fetch 3-month forward rate trends.</div>
      </div>
    );
  }

  return (
    <div className="anim-fade">
      {/* ── Key Indicators Executive Strip ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Best Projected Fare</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
            {INR(stats?.minFare)}
          </div>
          <div className="stat-sub">
            {stats?.cheapestEntry?.travel_date} · {stats?.cheapestEntry?.airline}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Horizon Average</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
            {INR(stats?.avgFare)}
          </div>
          <div className="stat-sub">Across {stats?.datesCount} forecast dates</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Max Surge Projection</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>
            {INR(stats?.maxFare)}
          </div>
          <div className="stat-sub">+{INR(stats ? stats.maxFare - stats.avgFare : 0)} above average</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Forecasting Engine</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
            {isMulti ? 'Dual Source' : providerLabel(providers[0])}
          </div>
          <div className="stat-sub">Up to 90 days forward outlook</div>
        </div>
      </div>

      {/* ── View Controls & Slicing Toolbar ──────────────────────────────── */}
      <div className="glass-sm" style={{
        padding: '12px 18px',
        marginBottom: 20,
        borderRadius: 'var(--r-md)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        background: '#ffffff',
      }}>
        {/* View Mode Tabs */}
        <div className="tab-bar" style={{ flex: 'none' }}>
          {[
            { id: 'trend',     label: 'Trend Curve',        icon: TrendingUp },
            { id: 'matrix',    label: 'Calendar Grid',      icon: CalendarIcon },
            { id: 'dow',       label: 'Day of Week',        icon: Clock },
            { id: 'advance',   label: 'Advance Curve (T+)', icon: CalendarDays },
            { id: 'dominance', label: 'Carrier Dominance',  icon: Plane },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(tab.id); setSelectedCell(null); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Source Slicer (when multi-source) */}
        {isMulti && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>SOURCE:</span>
            <div className="tab-bar" style={{ flex: 'none' }}>
              {[
                { id: 'all',            label: 'Both' },
                { id: 'easemytrip',     label: 'EaseMyTrip' },
                { id: 'google_flights', label: 'Google Flights' },
              ].map(s => (
                <button
                  key={s.id}
                  className={`tab-btn ${sourceFilter === s.id ? 'active' : ''}`}
                  onClick={() => setSourceFilter(s.id)}
                  style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Active View Body ──────────────────────────────────────────────── */}
      <div className="glass anim-fade-in" style={{ padding: '22px 24px', borderRadius: 'var(--r-lg)', background: '#ffffff', border: '1px solid var(--border)' }}>
        {/* VIEW 1: Trend Curve */}
        {activeTab === 'trend' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>90-Day Forward Fare Trajectory</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Continuous lowest airfare projections across travel dates
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={320}>
              {isMulti && sourceFilter === 'all' ? (
                <LineChart data={trendLineData} margin={{ left: 8, right: 16, top: 12, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(22, 67, 91, 0.08)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} interval={Math.max(0, Math.floor(trendLineData.length / 10))} />
                  <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }} />
                  <Line dataKey="emt" name="EaseMyTrip" stroke={PALETTE.emt} strokeWidth={2} dot={false} activeDot={{ r: 5 }} connectNulls />
                  <Line dataKey="gf"  name="Google Flights" stroke={PALETTE.gf}  strokeWidth={2} dot={false} activeDot={{ r: 5 }} connectNulls />
                </LineChart>
              ) : (
                <AreaChart data={trendLineData} margin={{ left: 8, right: 16, top: 12, bottom: 4 }}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PALETTE.navy} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={PALETTE.navy} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(22, 67, 91, 0.08)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} interval={Math.max(0, Math.floor(trendLineData.length / 10))} />
                  <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  {stats && (
                    <ReferenceLine y={stats.avgFare} stroke="rgba(22, 67, 91, 0.3)" strokeDasharray="4 4"
                      label={{ value: `Avg ${INR(stats.avgFare)}`, position: 'right', fill: 'var(--text-muted)', fontSize: 10 }} />
                  )}
                  <Area
                    type="monotone"
                    dataKey="fare"
                    name="Projected Lowest Fare"
                    stroke={PALETTE.navy}
                    fill="url(#trendGrad)"
                    strokeWidth={2.2}
                    dot={false}
                    activeDot={{ fill: PALETTE.navy, r: 5 }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {/* VIEW 2: Monthly Calendar Grid */}
        {activeTab === 'matrix' && (
          <div>
            <CalendarGridMatrix
              data={filteredData}
              onSelectDate={setSelectedCell}
              selectedDate={selectedCell?.dateStr}
            />

            {/* Selected Date Drawer */}
            {selectedCell && (
              <div className="anim-slide" style={{
                marginTop: 18,
                padding: '14px 18px',
                borderRadius: 'var(--r-md)',
                background: 'var(--accent-light)',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>
                    SELECTED DATE: {selectedCell.dateStr} ({new Date(selectedCell.dateStr).toLocaleDateString('en-US', { weekday: 'long' })})
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    Best Available Fare: <strong style={{ color: 'var(--green)', fontSize: '1.05rem', fontFamily: 'var(--font-mono)' }}>{INR(selectedCell.fare)}</strong>
                    {selectedCell.airline && ` · Carrier: ${selectedCell.airline}`}
                    {selectedCell.adv != null && ` · Advance: ${selectedCell.adv} days prior`}
                  </div>
                </div>
                <button className="btn btn-sm btn-ghost" onClick={() => setSelectedCell(null)}>
                  Dismiss
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: Day of Week Dynamics */}
        {activeTab === 'dow' && (
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700 }}>Day of Week Departure Variance</h3>
            <DayOfWeekDynamicsChart data={filteredData} />
          </div>
        )}

        {/* VIEW 4: Advance Purchase Curve */}
        {activeTab === 'advance' && (
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700 }}>Advance Booking Horizon Curve</h3>
            <AdvancePurchaseCurveChart data={filteredData} />
          </div>
        )}

        {/* VIEW 5: Carrier Dominance */}
        {activeTab === 'dominance' && (
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700 }}>Carrier Lowest-Fare Share</h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>
              Which airline offers the market floor price across calendar dates
            </div>
            <CarrierDominanceChart data={filteredData} />
          </div>
        )}
      </div>
    </div>
  );
}

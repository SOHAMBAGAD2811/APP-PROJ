import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { CalendarClock, TrendingUp } from 'lucide-react';

// ── Corridor config ───────────────────────────────────────────────────────────
const CORRIDORS = [
  { key: 'DEL-BOM', name: 'Delhi – Mumbai',      color: '#1a4d4a' },
  { key: 'DEL-BLR', name: 'Delhi – Bengaluru',   color: '#2d9b8a' },
  { key: 'BOM-BLR', name: 'Mumbai – Bengaluru',  color: '#06b6d4' },
  { key: 'DEL-CCU', name: 'Delhi – Kolkata',     color: '#c9a52d' },
  { key: 'MAA-DEL', name: 'Chennai – Delhi',     color: '#e05b52' },
  { key: 'BLR-HYD', name: 'Bengaluru – Hyderabad', color: '#8b5cf6' },
];

// Canonical lead bucket order
const LEAD_ORDER = ['T+1', 'T+7', 'T+15', 'T+30', 'T+45'];

const INR = n =>
  n != null ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—';

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function ElasticityTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-sm)',
      padding: '10px 14px',
      fontSize: '0.82rem',
      boxShadow: 'var(--shadow-md)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Booking window: {label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 20, color: p.color, marginBottom: 2 }}>
          <span>{p.name}</span>
          <strong>{INR(p.value)}</strong>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LeadTimeCurve() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    fetch('/api/apix/leadtime')
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(rows => {
        // Pivot: build [{lead_bucket: 'T+1', 'DEL-BOM': 6500, ...}, ...]
        const map = {};
        for (const lb of LEAD_ORDER) {
          map[lb] = { lead_bucket: lb };
        }
        for (const row of rows) {
          const lb = row.lead_bucket;   // "T+1", "T+7", etc.
          if (map[lb] !== undefined) {
            map[lb][row.corridor] = row.avg_price;
            // also store min/max for potential shading
            map[lb][`${row.corridor}_min`] = row.min_price;
            map[lb][`${row.corridor}_max`] = row.max_price;
          }
        }
        setData(LEAD_ORDER.map(lb => map[lb]));
        setLoading(false);
      })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, []);

  // Which corridors actually have data
  const activeCors = CORRIDORS.filter(c =>
    data.some(row => row[c.key] != null)
  );

  return (
    <div className="glass-sm" style={{ padding: '18px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <CalendarClock size={18} color="var(--accent-1)" />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Lead-Time Fare Elasticity
            </span>
            <span style={{
              fontSize: '0.7rem', fontWeight: 700,
              background: 'rgba(99,102,241,0.12)', color: 'var(--accent-1)',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: 5, padding: '2px 7px',
            }}>
              T+1 → T+45
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Advance-booking premium by DGCA corridor — how average fares scale from last-minute to 45 days ahead
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <TrendingUp size={13} />
          {activeCors.length} / 6 corridors active
        </div>
      </div>

      {loading && (
        <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              border: '2px solid rgba(99,102,241,0.2)',
              borderTopColor: 'var(--accent-1)',
              animation: 'spin 0.7s linear infinite',
              margin: '0 auto 10px',
            }} />
            Loading elasticity curve…
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: 20, color: 'var(--red)', fontSize: '0.85rem' }}>
          Failed to load lead-time data: {error}
        </div>
      )}

      {!loading && !error && activeCors.length === 0 && (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: 8 }}>
          <CalendarClock size={32} style={{ opacity: 0.3 }} />
          <div style={{ fontSize: '0.85rem' }}>No lead-time data yet — run a basket sweep to populate T+1 → T+45 windows.</div>
        </div>
      )}

      {!loading && !error && activeCors.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 8, right: 20, left: 10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis
              dataKey="lead_bucket"
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              tickLine={false} axisLine={false}
            />
            <YAxis
              tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              tickLine={false} axisLine={false}
              width={52}
            />
            <Tooltip content={<ElasticityTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '0.78rem', paddingTop: 10 }}
              formatter={(value) => {
                const c = CORRIDORS.find(x => x.key === value);
                return c ? `${c.key} (${c.name})` : value;
              }}
            />
            {activeCors.map(c => (
              <Line
                key={c.key}
                type="monotone"
                dataKey={c.key}
                name={c.key}
                stroke={c.color}
                strokeWidth={2.5}
                dot={{ r: 5, fill: c.color, strokeWidth: 0 }}
                activeDot={{ r: 7 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Insight footnote */}
      {!loading && !error && activeCors.length > 0 && (
        <div style={{
          marginTop: 12, paddingTop: 10,
          borderTop: '1px solid var(--border)',
          fontSize: '0.75rem', color: 'var(--text-muted)',
          display: 'flex', gap: 8, flexWrap: 'wrap',
        }}>
          <span>📌 <strong>Reading:</strong> A rising curve → last-minute fares are higher (normal).</span>
          <span>A flat/falling curve → abnormal market pressure or low demand.</span>
          <span>Isolates natural advance-booking premiums from index spikes.</span>
        </div>
      )}
    </div>
  );
}

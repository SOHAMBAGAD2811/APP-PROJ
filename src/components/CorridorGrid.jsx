/**
 * CorridorGrid.jsx — DGCA Basket Corridor Card Grid for the APIx tab.
 * Displays the 6 representative corridors with their live APIx and status.
 */

function apixColor(v) {
  if (v == null) return 'var(--text-muted)';
  if (v >= 115)  return '#f87171';
  if (v >= 105)  return '#fb923c';
  if (v <= 85)   return '#4ade80';
  if (v <= 95)   return '#86efac';
  return 'var(--accent-1)';
}

const INR = n =>
  n == null ? '—' : `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

/**
 * @param {object} props
 * @param {Array}  props.corridors   - summary.corridors from the API
 * @param {string} props.origin      - currently selected origin filter
 * @param {string} props.destination - currently selected destination filter
 * @param {function} props.onSelect  - called with corridorCode when a card is clicked
 * @param {function} props.onReset   - called when "Reset to National" is clicked
 */
export default function CorridorGrid({ corridors, origin, destination, onSelect, onReset }) {
  const isNationalView = !origin && !destination;

  return (
    <div>
      <div style={{
        fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.05em',
        marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span>DGCA FY 2024-25 Representative Corridor Basket</span>
        {!isNationalView && (
          <button
            onClick={onReset}
            style={{ background: 'none', border: 'none', color: 'var(--accent-1)', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600 }}
          >
            Reset to National Basket View
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {corridors.filter(c => c.is_basket).map(c => {
          const [cOrig, cDest] = c.corridor.split('-');
          const isSelected = origin && destination && (
            (origin === cOrig && destination === cDest) ||
            (destination === cOrig && origin === cDest)
          );
          return (
            <div
              key={c.corridor}
              onClick={() => onSelect(c.corridor)}
              className="glass-sm"
              style={{
                padding: '12px 14px', cursor: 'pointer', borderRadius: 'var(--r-sm)',
                border: isSelected ? '2px solid var(--accent-1)' : '1px solid var(--border)',
                background: isSelected ? 'var(--accent-light)' : 'var(--bg-surface)',
                boxShadow: isSelected ? 'var(--shadow-sm)' : 'var(--shadow-xs)',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>{c.corridor}</span>
                <span style={{
                  fontSize: '0.68rem', padding: '1px 6px', borderRadius: 4, fontWeight: 600,
                  background: c.is_observed ? 'var(--green-bg)' : 'var(--bg-muted)',
                  color: c.is_observed ? 'var(--green-text)' : 'var(--text-muted)',
                  border: `1px solid ${c.is_observed ? 'var(--green-border)' : 'var(--border)'}`,
                }}>
                  {c.is_observed ? '● Active' : '○ Pending'}
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 6 }}>{c.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  Weight: <strong>{c.weight_pct}%</strong>
                </span>
                <span style={{ fontWeight: 700, color: apixColor(c.corridor_apix) }}>
                  {c.corridor_apix ? `APIx ${c.corridor_apix.toFixed(1)}` : '—'}
                </span>
              </div>
              {c.current_avg && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Avg: <strong style={{ color: 'var(--text-primary)' }}>{INR(c.current_avg)}</strong></span>
                  <span>{c.sample_count} samples</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

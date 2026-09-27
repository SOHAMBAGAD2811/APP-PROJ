const fmt = n => n ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—';

function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function SourceStatCard({ label, emtFares, ctFares }) {
  const emtBest = emtFares.length
    ? emtFares.reduce((a, b) => (a.total_fare || Infinity) < (b.total_fare || Infinity) ? a : b)
    : null;
  const ctBest = ctFares.length
    ? ctFares.reduce((a, b) => (a.total_fare || Infinity) < (b.total_fare || Infinity) ? a : b)
    : null;

  const emtPrice = emtBest?.total_fare ?? null;
  const ctPrice  = ctBest?.total_fare  ?? null;
  const cheaper  = emtPrice != null && ctPrice != null
    ? (emtPrice <= ctPrice ? 'emt' : 'ct')
    : null;
  const isSameFlight = emtBest && ctBest && emtBest.flight_number === ctBest.flight_number;

  return (
    <div className="stat-card" style={{ gridColumn: 'span 2' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
        <div className="stat-label" style={{ margin: 0 }}>{label}</div>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          {isSameFlight ? 'Same flight across both' : 'Lowest entry fare per platform'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 20, marginTop: 8, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              EASEMYTRIP
            </span>
            {cheaper === 'emt' && <span className="badge badge-green" style={{ fontSize: '0.62rem' }}>Cheaper</span>}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'JetBrains Mono', color: cheaper === 'emt' ? 'var(--green)' : 'var(--text-primary)' }}>
            {fmt(emtPrice)}
          </div>
          {emtBest && <div className="stat-sub">{emtBest.flight_number} · {emtBest.travel_date}</div>}
        </div>

        <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              GOOGLE FLIGHTS
            </span>
            {cheaper === 'ct' && <span className="badge badge-green" style={{ fontSize: '0.62rem' }}>Cheaper</span>}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'JetBrains Mono', color: cheaper === 'ct' ? 'var(--green)' : 'var(--text-primary)' }}>
            {fmt(ctPrice)}
          </div>
          {ctBest && <div className="stat-sub">{ctBest.flight_number} · {ctBest.travel_date}</div>}
        </div>
      </div>
    </div>
  );
}

export default function StatsBar({ fares, emtFlights, ctFlights, calendarData }) {
  if (!fares || fares.length === 0) return null;

  const showComparison = Array.isArray(emtFlights) && emtFlights.length > 0
                      && Array.isArray(ctFlights)  && ctFlights.length  > 0;

  const total      = fares.length;
  const totalFares = fares.map(f => f.total_fare).filter(Boolean);
  const cheapest   = fares.reduce((a, b) => (a.total_fare || Infinity) < (b.total_fare || Infinity) ? a : b, fares[0]);
  const avg        = totalFares.length ? totalFares.reduce((a, b) => a + b, 0) / totalFares.length : 0;
  const nonstop    = fares.filter(f => f.stops === 0).length;
  const dates      = [...new Set(fares.map(f => f.travel_date))].sort();

  return (
    <div className="stats-bar anim-slide" style={{ animationDelay: '0.1s' }}>
      <StatCard
        label="Total Flights"
        value={total}
        sub={`across ${dates.length} date${dates.length !== 1 ? 's' : ''}`}
      />

      {showComparison ? (
        <SourceStatCard
          label="Cheapest Fare by Source"
          emtFares={emtFlights}
          ctFares={ctFlights}
        />
      ) : (
        <StatCard
          label="Cheapest Fare"
          value={fmt(cheapest?.total_fare)}
          sub={`${cheapest?.flight_number} · ${cheapest?.travel_date}`}
        />
      )}

      <StatCard
        label="Average Fare"
        value={fmt(avg)}
        sub={`${nonstop} non-stop available`}
      />

      <StatCard
        label="Route"
        value={<span style={{ fontSize: '1.3rem' }}>{fares[0]?.origin} → {fares[0]?.destination}</span>}
        sub={dates[0] + (dates.length > 1 ? ` – ${dates[dates.length - 1]}` : '')}
      />
    </div>
  );
}

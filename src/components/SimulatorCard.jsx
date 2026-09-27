import React, { useState, useEffect, useCallback } from 'react';
import { Zap, TrendingUp, Settings2, Info } from 'lucide-react';

function apixColor(v) {
  if (v == null) return 'var(--text-muted)';
  if (v >= 115)  return '#f87171';
  if (v >= 105)  return '#fb923c';
  if (v <= 85)   return '#4ade80';
  if (v <= 95)   return '#86efac';
  return 'var(--accent-1)';
}

export default function SimulatorCard() {
  const [fuel, setFuel] = useState(0);
  const [demand, setDemand] = useState(0);
  const [capacity, setCapacity] = useState(0);
  const [results, setResults] = useState(null);

  const fetchSimulation = useCallback(async (f, d, c) => {
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fuel_delta_pct: f,
          demand_delta_pct: d,
          capacity_delta_pct: c
        })
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (e) {
      console.error('Simulation error', e);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSimulation(fuel, demand, capacity);
    }, 300);
    return () => clearTimeout(timer);
  }, [fuel, demand, capacity, fetchSimulation]);

  const fareChangeColor = results?.simulated_fare_change_pct > 0 ? '#f87171' : results?.simulated_fare_change_pct < 0 ? '#4ade80' : 'var(--text-primary)';

  return (
    <div className="glass-sm" style={{ padding: '18px 20px', marginTop: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Settings2 size={18} color="var(--accent-1)" />
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>🔬 What-If Policy Simulator</h3>
      </div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20 }}>
        Model economic pass-through effects on the Airfare Price Index
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.85rem' }}>
              <label style={{ fontWeight: 600 }}>⛽ ATF Fuel Price Change</label>
              <span>{fuel > 0 ? '+' : ''}{fuel}%</span>
            </div>
            <input type="range" min="-20" max="20" step="1" value={fuel} onChange={e => setFuel(Number(e.target.value))} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.85rem' }}>
              <label style={{ fontWeight: 600 }}>📈 Demand Surge</label>
              <span>{demand > 0 ? '+' : ''}{demand}%</span>
            </div>
            <input type="range" min="-30" max="30" step="1" value={demand} onChange={e => setDemand(Number(e.target.value))} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.85rem' }}>
              <label style={{ fontWeight: 600 }}>✈️ Seat Capacity Change</label>
              <span>{capacity > 0 ? '+' : ''}{capacity}%</span>
            </div>
            <input type="range" min="-30" max="30" step="1" value={capacity} onChange={e => setCapacity(Number(e.target.value))} />
          </div>
        </div>

        {/* Results */}
        {results ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="glass" style={{ padding: 12 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Fuel Impact</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#3b82f6' }}>{results.fuel_impact_pct > 0 ? '+' : ''}{results.fuel_impact_pct?.toFixed(1)}%</div>
            </div>
            <div className="glass" style={{ padding: 12 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Capacity Impact</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#a855f7' }}>{results.capacity_impact_pct > 0 ? '+' : ''}{results.capacity_impact_pct?.toFixed(1)}%</div>
            </div>
            <div className="glass" style={{ padding: 12 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Simulated Fare Change</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: fareChangeColor }}>
                {results.simulated_fare_change_pct > 0 ? '+' : ''}{results.simulated_fare_change_pct?.toFixed(1)}%
              </div>
            </div>
            <div className="glass" style={{ padding: 12 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Simulated APIx</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: apixColor(results.simulated_apix) }}>
                {results.simulated_apix?.toFixed(1)}
              </div>
            </div>
            <div className="glass" style={{ padding: 12, gridColumn: 'span 2' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CPI Impact</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {results.cpi_impact_bps > 0 ? '+' : ''}{results.cpi_impact_bps?.toFixed(1)} bps
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Loading simulation...
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <Info size={14} />
        Methodology: ATF elasticity: ΔFare ≈ ΔFuel × 0.38 | Capacity pressure: (ΔDemand − ΔCapacity) × 0.45 | CPI air transport weight: 0.138%
      </div>
    </div>
  );
}

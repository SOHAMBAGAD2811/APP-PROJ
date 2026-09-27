import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Polyline, Tooltip, CircleMarker } from 'react-leaflet';
import { ShieldCheck, Layers, Eye } from 'lucide-react';

// ── Airport coordinates (Official DGCA Hubs) ──────────────────────────────────
const AIRPORTS = {
  DEL: { coords: [28.5665, 77.1031], name: 'Delhi', code: 'DEL' },
  BOM: { coords: [19.0896, 72.8656], name: 'Mumbai', code: 'BOM' },
  BLR: { coords: [13.1986, 77.7066], name: 'Bengaluru', code: 'BLR' },
  MAA: { coords: [12.9941, 80.1709], name: 'Chennai', code: 'MAA' },
  CCU: { coords: [22.6542, 88.4467], name: 'Kolkata', code: 'CCU' },
  HYD: { coords: [17.2313, 78.4300], name: 'Hyderabad', code: 'HYD' },
};

// ── DGCA corridor config ──────────────────────────────────────────────────────
const CORRIDOR_CONFIG = [
  { key: 'DEL-BOM', from: 'DEL', to: 'BOM', weight: 5,   color: '#6366f1', weightPct: '29.58%' },
  { key: 'DEL-BLR', from: 'DEL', to: 'BLR', weight: 4,   color: '#8b5cf6', weightPct: '20.21%' },
  { key: 'BOM-BLR', from: 'BOM', to: 'BLR', weight: 3.5, color: '#06b6d4', weightPct: '17.76%' },
  { key: 'DEL-CCU', from: 'DEL', to: 'CCU', weight: 3,   color: '#10b981', weightPct: '11.96%' },
  { key: 'MAA-DEL', from: 'MAA', to: 'DEL', weight: 2.5, color: '#f59e0b', weightPct: '10.59%' },
  { key: 'BLR-HYD', from: 'BLR', to: 'HYD', weight: 2,   color: '#ef4444', weightPct: '9.90%'  },
];

const INR = n => n != null ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—';

function apixColor(v) {
  if (v == null) return '#9294a8';
  if (v >= 115) return '#f87171';
  if (v >= 105) return '#fb923c';
  if (v <= 85)  return '#4ade80';
  if (v <= 95)  return '#86efac';
  return '#6366f1';
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function RouteHeatmap({ corridors = [] }) {
  const [statesGeoJson, setStatesGeoJson] = useState(null);
  const [boundaryGeoJson, setBoundaryGeoJson] = useState(null);
  const [mapStyle, setMapStyle] = useState('soi'); // 'soi' (vector) | 'osm' (satellite/osm tile)

  // Fetch official Survey of India bundled GeoJSONs
  useEffect(() => {
    fetch('/india_states.json')
      .then(res => res.ok ? res.json() : null)
      .then(data => setStatesGeoJson(data))
      .catch(() => {});

    fetch('/india_boundary.json')
      .then(res => res.ok ? res.json() : null)
      .then(data => setBoundaryGeoJson(data))
      .catch(() => {});
  }, []);

  // Build lookup from API corridors list
  const corridorMap = {};
  for (const c of (corridors || [])) {
    if (c?.corridor) corridorMap[c.corridor] = c;
  }

  // Collect unique airports
  const usedAirports = new Set();
  for (const cfg of CORRIDOR_CONFIG) {
    usedAirports.add(cfg.from);
    usedAirports.add(cfg.to);
  }

  // State polygon styling for thematic Survey of India map
  const stateStyle = () => ({
    fillColor: mapStyle === 'soi' ? '#f8fafc' : '#ffffff',
    fillOpacity: mapStyle === 'soi' ? 0.9 : 0.05,
    color: mapStyle === 'soi' ? '#cbd5e1' : 'rgba(99,102,241,0.2)',
    weight: mapStyle === 'soi' ? 1 : 0.8,
  });

  const onEachState = (feature, layer) => {
    if (feature.properties && feature.properties.name) {
      layer.bindTooltip(feature.properties.name, {
        sticky: true,
        direction: 'center',
        className: 'state-tooltip',
      });
      layer.on({
        mouseover: (e) => {
          const l = e.target;
          l.setStyle({
            fillColor: mapStyle === 'soi' ? '#e2e8f0' : 'rgba(99,102,241,0.15)',
            fillOpacity: 0.95,
          });
        },
        mouseout: (e) => {
          const l = e.target;
          l.setStyle(stateStyle());
        },
      });
    }
  };

  // Outer national boundary styling (official Survey of India perimeter)
  const boundaryStyle = () => ({
    fill: false,
    color: '#475569',
    weight: 2,
    opacity: 0.95,
  });

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
      {/* Sub-header Bar: Compliance badge + Map style selector */}
      <div style={{
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        background: 'rgba(99,102,241,0.04)',
        borderBottom: '1px solid var(--border)',
        fontSize: '0.78rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(16,185,129,0.12)',
            color: '#10b981',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 5,
            padding: '2px 7px',
            fontWeight: 700,
            fontSize: '0.72rem',
          }}>
            <ShieldCheck size={12} />
            Official Survey of India (SOI) Compliant Boundary
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            Includes full J&amp;K, Ladakh, and Arunachal Pradesh territories
          </span>
        </div>

        {/* View style toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => setMapStyle('soi')}
            className={mapStyle === 'soi' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: 4 }}
          >
            🇮🇳 SOI Vector Map
          </button>
          <button
            onClick={() => setMapStyle('osm')}
            className={mapStyle === 'osm' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: 4 }}
          >
            🗺️ Street Layer
          </button>
        </div>
      </div>

      <MapContainer
        center={[22.8, 80.5]}
        zoom={5}
        style={{ height: 440, width: '100%', background: mapStyle === 'soi' ? '#e2e8f0' : '#f8fafc' }}
        scrollWheelZoom={false}
      >
        {/* Optional base tile layer if switched to street mode */}
        {mapStyle === 'osm' && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            opacity={0.65}
          />
        )}

        {/* 1. Official State Boundaries */}
        {statesGeoJson && (
          <GeoJSON
            key={`states-${mapStyle}`}
            data={statesGeoJson}
            style={stateStyle}
            onEachFeature={onEachState}
          />
        )}

        {/* 2. Official National Outer Boundary (Survey of India) */}
        {boundaryGeoJson && (
          <GeoJSON
            key={`boundary-${mapStyle}`}
            data={boundaryGeoJson}
            style={boundaryStyle}
          />
        )}

        {/* 3. Flight Corridors */}
        {CORRIDOR_CONFIG.map(cfg => {
          const fromAp = AIRPORTS[cfg.from];
          const toAp   = AIRPORTS[cfg.to];
          if (!fromAp || !toAp) return null;
          const apiData  = corridorMap[cfg.key] || {};
          const apix     = apiData.corridor_apix;
          const lineColor = apix != null ? apixColor(apix) : cfg.color;

          return (
            <Polyline
              key={cfg.key}
              positions={[fromAp.coords, toAp.coords]}
              pathOptions={{
                color: lineColor,
                weight: cfg.weight + 1.5,
                opacity: 0.9,
                dashArray: apiData.is_observed === false ? '6 4' : undefined,
              }}
            >
              <Tooltip sticky>
                <div style={{ fontSize: '0.82rem', minWidth: 170 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{fromAp.name} ({cfg.from}) → {toAp.name} ({cfg.to})</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginBottom: 4 }}>
                    {apiData.name || cfg.key}
                  </div>
                  <div>DGCA Traffic Weight: <strong>{cfg.weightPct}</strong></div>
                  {apix != null && (
                    <div>Corridor APIx: <strong style={{ color: apixColor(apix) }}>{apix.toFixed(1)}</strong></div>
                  )}
                  {apiData.current_avg != null && (
                    <div>Current Avg Fare: <strong>{INR(apiData.current_avg)}</strong></div>
                  )}
                  {apiData.sample_count != null && (
                    <div>Quotes observed: {apiData.sample_count}</div>
                  )}
                </div>
              </Tooltip>
            </Polyline>
          );
        })}

        {/* 4. Airport Nodes */}
        {[...usedAirports].map(code => {
          const ap = AIRPORTS[code];
          if (!ap) return null;
          return (
            <CircleMarker
              key={code}
              center={ap.coords}
              radius={7}
              pathOptions={{
                color: '#1e293b',
                weight: 2,
                fillColor: '#ffffff',
                fillOpacity: 1,
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} permanent>
                <span style={{ fontWeight: 700, fontSize: '0.74rem' }}>{ap.code}</span>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend & Guidance Strip */}
      <div style={{
        padding: '10px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 14,
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        background: 'var(--bg-subtle)',
        borderTop: '1px solid var(--border)',
      }}>
        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>DGCA Basket Corridors:</span>
        {CORRIDOR_CONFIG.map(cfg => {
          const apiData = corridorMap[cfg.key] || {};
          const apix    = apiData.corridor_apix;
          return (
            <span key={cfg.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                display: 'inline-block',
                width: 16,
                height: 3.5,
                background: apix != null ? apixColor(apix) : cfg.color,
                borderRadius: 2,
              }} />
              {cfg.key} ({cfg.weightPct})
            </span>
          );
        })}
        <span style={{ marginLeft: 'auto', fontStyle: 'italic', fontSize: '0.72rem' }}>
          Line color = APIx price pressure | Thickness = passenger weight
        </span>
      </div>
    </div>
  );
}

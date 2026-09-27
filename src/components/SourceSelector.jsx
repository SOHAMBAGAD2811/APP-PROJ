import { OTA_LOGOS } from '../utils/airlines';
import { Layers } from 'lucide-react';

export default function SourceSelector({ value, onChange }) {
  const options = [
    { id: 'emt',      label: 'EaseMyTrip', icon: OTA_LOGOS.easemytrip },
    { id: 'ct',       label: 'Google Flights', icon: OTA_LOGOS.google_flights },
    { id: 'indigo',   label: 'IndiGo Direct', icon: OTA_LOGOS.indigo },
    { id: 'airindia', label: 'Air India Direct', icon: OTA_LOGOS.airindia },
    { id: 'both',     label: 'Multi-Source Aggregator', icon: null },
  ];
  return (
    <div className="source-selector">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="source-label">Fare Scraper Source</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'none', mdDisplay: 'inline' }}>
          • Real-time rate discovery engine
        </span>
      </div>
      <div className="source-pills">
        {options.map(o => (
          <button
            key={o.id}
            className={`source-pill ${value === o.id ? 'active' : ''}`}
            onClick={() => onChange(o.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '7px' }}
          >
            {o.icon && <img src={o.icon} alt={o.id} width="16" height="16" style={{ borderRadius: '3px' }} />}
            {!o.icon && o.id === 'both' && <Layers size={14} strokeWidth={2.2} />}
            <span>{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

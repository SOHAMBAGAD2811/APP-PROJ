import { getAirlineInfo, OTA_LOGOS } from '../utils/airlines';

export function ProviderBadge({ provider }) {
  if (!provider) return null;
  const config = {
    easemytrip:     { label: 'EMT', color: 'badge-blue',  icon: OTA_LOGOS.easemytrip },
    cleartrip:      { label: 'GF',  color: 'badge-green', icon: OTA_LOGOS.google_flights || OTA_LOGOS.cleartrip },
    google_flights: { label: 'GF',  color: 'badge-green', icon: OTA_LOGOS.google_flights },
  };
  const { label, color, icon } = config[provider] || { label: provider.slice(0,4).toUpperCase(), color: 'badge-amber', icon: null };
  
  return (
    <span className={`badge ${color}`} style={{ fontSize: '0.68rem', display: 'inline-flex', gap: '4px', padding: '2px 8px 2px 4px' }}>
      {icon && <img src={icon} alt={label} width="14" height="14" style={{ borderRadius: '50%' }} />}
      {label}
    </span>
  );
}

export function AirlineLogo({ airlineCode }) {
  if (!airlineCode) return <span>—</span>;
  const { name, logo } = getAirlineInfo(airlineCode);
  
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      {logo && (
        <img
          src={logo}
          alt={name}
          width="20"
          height="20"
          style={{ objectFit: 'contain' }}
          onError={(e) => e.target.style.display = 'none'}
        />
      )}
      <span>{name}</span>
    </div>
  );
}

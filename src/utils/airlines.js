export const AIRLINES = {
  '6E': { name: 'IndiGo', logo: '/logos/6E.png' },
  'AI': { name: 'Air India', logo: '/logos/AI.png' },
  'UK': { name: 'Vistara', logo: '/logos/UK.png' },
  'SG': { name: 'SpiceJet', logo: '/logos/SG.png' },
  'QP': { name: 'Akasa Air', logo: '/logos/QP.png' },
  'IX': { name: 'Air India Express', logo: '/logos/IX.png' },
  '9I': { name: 'Alliance Air', logo: '/logos/9I.png' },
  'S5': { name: 'Star Air', logo: '/logos/S5.png' },
};

export function getAirlineInfo(code) {
  if (!code) return { name: 'Unknown', logo: null };
  const clean = code.trim().toLowerCase();
  if (clean.includes('indigo') || clean === '6e') return AIRLINES['6E'];
  if (clean.includes('express') || clean === 'ix' || clean === 'i5') return AIRLINES['IX'];
  if (clean.includes('air india') || clean === 'ai') return AIRLINES['AI'];
  if (clean.includes('akasa') || clean === 'qp') return AIRLINES['QP'];
  if (clean.includes('spice') || clean === 'sg') return AIRLINES['SG'];
  if (clean.includes('vistara') || clean === 'uk') return AIRLINES['UK'];
  if (clean.includes('alliance') || clean === '9i') return AIRLINES['9I'];
  if (clean.includes('star') || clean === 's5') return AIRLINES['S5'];

  const iata = code.trim().slice(0, 2).toUpperCase();
  return AIRLINES[iata] || { name: code, logo: null };
}


export const OTA_LOGOS = {
  easemytrip: '/logos/easemytrip.png',
  cleartrip: '/logos/cleartrip.png',
  google_flights: '/logos/google_flights.svg',
  indigo: '/logos/6E.png',
  airindia: '/logos/AI.png',
};

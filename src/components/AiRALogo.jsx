import React from 'react';

/**
 * AiRALogo
 * Bespoke vector emblem for AiRA (Aviation Intelligence & Research Analytics).
 * Integrates an aerodynamic supersonic delta aircraft, radar intelligence arcs, and terracotta thrust.
 */
export default function AiRALogo({
  size = 28,
  variant = 'mark', // 'mark' | 'badge' | 'full'
  glow = false,
  className = '',
  style = {},
}) {
  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        filter: glow ? 'drop-shadow(0 0 8px rgba(194, 94, 61, 0.45))' : 'none',
        ...style,
      }}
      className={className}
    >
      <defs>
        {/* Navy Petroleum Gradient */}
        <linearGradient id="airaNavyGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="40%" stopColor="#1e5675" />
          <stop offset="100%" stopColor="#0f3347" />
        </linearGradient>

        {/* Warm Terracotta Afterburner Gradient */}
        <linearGradient id="airaThrustGrad" x1="12" y1="36" x2="28" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>

        {/* Wing Accents */}
        <linearGradient id="airaWingGrad" x1="10" y1="10" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#dce8ee" stopOpacity="0.75" />
        </linearGradient>
      </defs>

      {/* Radar Intelligence Arcs in Background */}
      <path
        d="M 10 32 A 18 18 0 0 1 38 10"
        stroke="#38bdf8"
        strokeWidth="1.8"
        strokeDasharray="2.5 3.5"
        strokeOpacity="0.45"
        strokeLinecap="round"
      />
      <path
        d="M 6 36 A 24 24 0 0 1 42 6"
        stroke="#38bdf8"
        strokeWidth="1.5"
        strokeDasharray="3 4.5"
        strokeOpacity="0.25"
        strokeLinecap="round"
      />

      {/* Terracotta Kinetic Thrust Trails */}
      <path
        d="M 13 35 L 20 28 L 17 38 Z"
        fill="url(#airaThrustGrad)"
        opacity="0.9"
      />
      <circle cx="14" cy="36" r="2.2" fill="#ea580c" />

      {/* Main Supersonic Delta Wing Silhouette */}
      <path
        d="M 40 8 L 27 25 L 17 22 L 20 28 L 28 29 L 24 40 L 30 33 L 34 35 L 36 26 L 42 16 L 40 8 Z"
        fill="url(#airaNavyGrad)"
      />

      {/* Highlight Top Blade Edge */}
      <path
        d="M 40 8 L 22 26 L 27 27 L 40 8 Z"
        fill="url(#airaWingGrad)"
      />

      {/* Autonomous Intelligence Core Beacon */}
      <circle cx="30" cy="18" r="2.2" fill="#38bdf8" />
      <circle cx="30" cy="18" r="4.2" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.6" />
    </svg>
  );

  if (variant === 'mark') {
    return mark;
  }

  if (variant === 'badge') {
    return (
      <div
        style={{
          width: size + 14,
          height: size + 14,
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #0b2433 0%, #16435b 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 4px 12px rgba(15, 51, 71, 0.28)',
          ...style,
        }}
        className={className}
      >
        {mark}
      </div>
    );
  }

  // 'full' variant: Logo Mark + AiRA wordmark
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        ...style,
      }}
      className={className}
    >
      {mark}
      <div>
        <div
          style={{
            fontFamily: 'var(--font-sans, inherit)',
            fontWeight: 800,
            fontSize: `${size * 0.75}px`,
            letterSpacing: '-0.02em',
            color: 'var(--accent, #16435b)',
            lineHeight: 1.1,
          }}
        >
          AiRA
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: `${Math.max(9, size * 0.32)}px`,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted, #77878f)',
            fontWeight: 700,
            lineHeight: 1,
            marginTop: '2px',
          }}
        >
          AVIATION INTELLIGENCE
        </div>
      </div>
    </div>
  );
}

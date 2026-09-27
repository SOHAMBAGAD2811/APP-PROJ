import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Cpu, Plane, Sparkles } from 'lucide-react';

const PIPELINE_STEPS = [
  { id: 1, label: 'Corridor Check' },
  { id: 2, label: 'Gateway Query' },
  { id: 3, label: 'Unbundle Fees' },
  { id: 4, label: 'Lowe Indexing' },
  { id: 5, label: 'Complete' },
];

export default function ScrapeProgressBar({
  loading,
  progress = 0,
  stage = '',
  step = 0,
  totalSteps = 5,
  details = '',
  source = '',
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let timer;
    if (loading) {
      setElapsed(0);
      timer = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(timer);
  }, [loading]);

  if (!loading && progress === 0) return null;

  const currentStep = step || Math.min(5, Math.max(1, Math.ceil((progress / 100) * 5)));
  const displayProgress = Math.min(100, Math.max(8, progress));

  return (
    <div
      className="anim-fade-in"
      style={{
        background: '#ffffff',
        borderRadius: 'var(--r-md, 8px)',
        padding: '16px 20px',
        color: 'var(--text-primary, #173747)',
        border: '1px solid var(--border, #dce3e6)',
        boxShadow: 'var(--shadow-sm, 0 1px 3px 0 rgba(23, 55, 71, 0.06))',
        marginBottom: '20px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color var(--t-fast), box-shadow var(--t-fast)',
      }}
    >
      {/* Top Status Bar: Title, Step, Timer & Percentage */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--r-sm, 5px)',
              background: '#edf3f4',
              border: '1px solid #dce5e8',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--accent, #16435b)',
              flexShrink: 0,
            }}
          >
            <Cpu size={18} strokeWidth={2.2} className="anim-pulse" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: 'var(--text-muted, #77878f)',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                ON-DEMAND SCRAPE PIPELINE
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: '#eef5f8',
                  color: 'var(--accent, #16435b)',
                  fontWeight: 700,
                  border: '1px solid #bfdbfe',
                  letterSpacing: '0.04em',
                }}
              >
                {source ? source.toUpperCase() : 'MULTI-SOURCE'}
              </span>
            </div>
            <div
              style={{
                fontSize: '1.02rem',
                fontWeight: 700,
                color: 'var(--text-primary, #173747)',
                marginTop: '1px',
                fontFamily: 'var(--font-sans, inherit)',
              }}
            >
              {stage || 'Processing Flight Scrape Pipeline...'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.78rem',
              color: 'var(--text-muted, #77878f)',
              fontFamily: 'var(--font-mono, monospace)',
              background: 'var(--bg-subtle, #f1f5f7)',
              padding: '3px 8px',
              borderRadius: '4px',
              border: '1px solid var(--border-subtle, #edf2f4)',
            }}
          >
            <Clock size={12} />
            <span>{String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}s</span>
          </div>

          <div
            style={{
              background: '#eef5f8',
              padding: '3px 9px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--accent, #16435b)',
              border: '1px solid #bfdbfe',
            }}
          >
            {Math.round(displayProgress)}%
          </div>
        </div>
      </div>

      {/* The Animated Slide-Bar (Progress Bar) */}
      <div
        style={{
          width: '100%',
          height: '8px',
          background: '#edf2f4',
          borderRadius: '999px',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #dce3e6',
          marginBottom: '14px',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${displayProgress}%`,
            background: 'linear-gradient(90deg, #16435b 0%, #1e5675 65%, #c25e3d 100%)',
            borderRadius: '999px',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
          }}
        >
          {/* Shimmer sweep animation */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
              animation: 'slideGlow 1.6s infinite',
            }}
          />
        </div>
      </div>

      {/* Step Pills Stepper matching .corridor-chip design */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '6px',
          marginBottom: '12px',
        }}
      >
        {PIPELINE_STEPS.map((s) => {
          const isDone = s.id < currentStep || progress === 100;
          const isCurrent = s.id === currentStep && progress < 100;

          return (
            <div
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 8px',
                borderRadius: 'var(--r-sm, 5px)',
                background: isCurrent
                  ? '#eef5f8'
                  : isDone
                  ? '#edf4ef'
                  : 'var(--bg-subtle, #f8fafb)',
                border: isCurrent
                  ? '1px solid #16435b'
                  : isDone
                  ? '1px solid #c8decf'
                  : '1px solid var(--border-subtle, #edf2f4)',
                fontSize: '0.72rem',
                fontWeight: isCurrent ? 700 : 500,
                color: isCurrent
                  ? '#16435b'
                  : isDone
                  ? '#235d3d'
                  : 'var(--text-muted, #9aa7ad)',
                boxShadow: isCurrent ? '0 0 0 1px rgba(22, 67, 91, 0.12)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {isDone ? (
                <CheckCircle2 size={12} color="#2e7d52" />
              ) : isCurrent ? (
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#16435b',
                    display: 'inline-block',
                    boxShadow: '0 0 4px rgba(22, 67, 91, 0.5)',
                  }}
                />
              ) : (
                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: '#cbd5e1',
                    display: 'inline-block',
                  }}
                />
              )}
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Terminal Live Details Log */}
      {details && (
        <div
          style={{
            background: 'var(--bg-base, #f8fafb)',
            borderRadius: 'var(--r-sm, 5px)',
            padding: '7px 12px',
            fontSize: '0.76rem',
            fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--text-secondary, #4d606a)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid #e4eaed',
          }}
        >
          <span style={{ color: 'var(--accent-warm, #c25e3d)', fontWeight: 700 }}>❯</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {details}
          </span>
        </div>
      )}

      {/* CSS Animation Keyframes */}
      <style>{`
        @keyframes slideGlow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

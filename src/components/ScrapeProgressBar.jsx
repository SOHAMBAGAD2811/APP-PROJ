import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, Clock, Cpu, Plane, Server } from 'lucide-react';

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
        background: 'linear-gradient(145deg, #0b2230 0%, #16435b 100%)',
        borderRadius: '12px',
        padding: '18px 22px',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 12px 28px -6px rgba(11, 34, 48, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        marginBottom: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '160px',
          height: '160px',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Status Bar: Title, Step, Timer & Percentage */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
            }}
          >
            <Cpu size={16} className="anim-pulse" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: '#93c5fd',
                }}
              >
                BACKEND SCRAPING ENGINE
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.18)',
                  color: '#bae6fd',
                  fontWeight: 600,
                }}
              >
                {source ? source.toUpperCase() : 'MULTI-SOURCE'}
              </span>
            </div>
            <div
              style={{
                fontSize: '0.96rem',
                fontWeight: 600,
                color: '#ffffff',
                marginTop: '1px',
              }}
            >
              {stage || 'Processing Flight Scrape Pipeline...'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.78rem',
              color: '#94a3b8',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            <Clock size={13} />
            <span>{String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}s</span>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.14)',
              padding: '3px 10px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono, monospace)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
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
          height: '10px',
          background: 'rgba(15, 23, 42, 0.65)',
          borderRadius: '999px',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '14px',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${displayProgress}%`,
            background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 50%, #34d399 100%)',
            borderRadius: '999px',
            transition: 'width 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            boxShadow: '0 0 14px rgba(56, 189, 248, 0.6)',
          }}
        >
          {/* Shimmer overlay animation */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              animation: 'shimmerSlide 1.8s infinite',
            }}
          />
        </div>
      </div>

      {/* Step Pills Stepper */}
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
                borderRadius: '6px',
                background: isCurrent
                  ? 'rgba(56, 189, 248, 0.2)'
                  : isDone
                  ? 'rgba(52, 211, 153, 0.15)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: isCurrent
                  ? '1px solid rgba(56, 189, 248, 0.45)'
                  : isDone
                  ? '1px solid rgba(52, 211, 153, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.05)',
                fontSize: '0.72rem',
                fontWeight: isCurrent ? 700 : 500,
                color: isCurrent ? '#bae6fd' : isDone ? '#a7f3d0' : '#64748b',
                transition: 'all 0.25s ease',
              }}
            >
              {isDone ? (
                <CheckCircle2 size={12} color="#34d399" />
              ) : isCurrent ? (
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#38bdf8',
                    display: 'inline-block',
                    boxShadow: '0 0 6px #38bdf8',
                  }}
                />
              ) : (
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
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
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '6px',
            padding: '7px 12px',
            fontSize: '0.76rem',
            fontFamily: 'var(--font-mono, monospace)',
            color: '#cbd5e1',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>❯</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {details}
          </span>
        </div>
      )}

      {/* CSS Animation Keyframes */}
      <style>{`
        @keyframes shimmerSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

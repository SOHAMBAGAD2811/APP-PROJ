import React, { useState } from 'react';
import { X } from 'lucide-react';
import ChatTab from './ChatTab';
import AiRALogo from './AiRALogo';

export default function FloatingChatWidget({
  source = 'both',
  fares = [],
  emtFlights = [],
  ctFlights = [],
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
      {/* Floating Prompt Pill — "Use AiRA Bot" */}
      {!isOpen && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsOpen(true); }}
          title="Open AiRA Bot Intelligence Assistant"
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '94px',
            zIndex: 9997,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '7px 15px',
            borderRadius: '999px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f6fafc 100%)',
            border: '1px solid rgba(22, 67, 91, 0.22)',
            boxShadow: '0 6px 20px -3px rgba(15, 51, 71, 0.18), 0 0 0 1px rgba(22, 67, 91, 0.05)',
            cursor: 'pointer',
            transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            userSelect: 'none',
            animation: 'slideInPill 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(-3px) scale(1.02)';
            e.currentTarget.style.borderColor = '#16435b';
            e.currentTarget.style.boxShadow = '0 10px 24px -4px rgba(15, 51, 71, 0.26), 0 0 0 1px #16435b';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.borderColor = 'rgba(22, 67, 91, 0.22)';
            e.currentTarget.style.boxShadow = '0 6px 20px -3px rgba(15, 51, 71, 0.18), 0 0 0 1px rgba(22, 67, 91, 0.05)';
          }}
        >
          {/* Pulsing Emerald Beacon */}
          <span
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '8px',
              height: '8px',
            }}
          >
            <span
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: '#10b981',
                opacity: 0.75,
                animation: 'pulseBeacon 2s cubic-bezier(0, 0, 0.2, 1) infinite',
              }}
            />
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 6px #10b981',
              }}
            />
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span
              style={{
                fontSize: '0.84rem',
                fontWeight: 800,
                color: '#16435b',
                letterSpacing: '-0.01em',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              Use AiRA Bot
              <span style={{ color: '#c25e3d', fontSize: '0.74rem' }}>⚡</span>
            </span>
            <span
              style={{
                fontSize: '0.67rem',
                color: '#77878f',
                fontWeight: 600,
                letterSpacing: '0.04em',
                fontFamily: 'var(--font-mono, monospace)',
                textTransform: 'uppercase',
              }}
            >
              Flight Intelligence
            </span>
          </div>
        </div>
      )}

      {/* Floating Trigger Circle Button with Bespoke AiRA Emblem */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={isOpen ? 'Close AiRA Bot' : 'Open AiRA Bot Intelligence Assistant'}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '58px',
          height: '58px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #091e2b 0%, #113447 50%, #16435b 100%)',
          border: '1.5px solid rgba(255, 255, 255, 0.25)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 8px 24px -2px rgba(11, 35, 49, 0.42), 0 0 0 1px rgba(22, 67, 91, 0.15)',
          zIndex: 9998,
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: isOpen ? 'rotate(90deg)' : 'scale(1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = isOpen ? 'rotate(90deg) scale(1.08)' : 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 12px 30px -2px rgba(11, 35, 49, 0.55), 0 0 16px rgba(56, 189, 248, 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = isOpen ? 'rotate(90deg)' : 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 24px -2px rgba(11, 35, 49, 0.42), 0 0 0 1px rgba(22, 67, 91, 0.15)';
        }}
      >
        {isOpen ? (
          <X size={22} strokeWidth={2.4} />
        ) : (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AiRALogo size={28} glow />
            {/* Live Indicator Beacon Dot */}
            <span
              style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#10b981',
                border: '2px solid #091e2b',
                boxShadow: '0 0 6px #10b981',
              }}
            />
          </div>
        )}
      </button>

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <>
          {/* Fullscreen Backdrop Blur */}
          {isFullscreen && (
            <div
              onClick={() => setIsFullscreen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(9, 30, 43, 0.55)',
                backdropFilter: 'blur(5px)',
                zIndex: 9999,
                animation: 'fadeOverlay 0.2s ease',
              }}
            />
          )}

          <div
            className="anim-slide"
            style={
              isFullscreen
                ? {
                    position: 'fixed',
                    top: '20px',
                    bottom: '20px',
                    left: '20px',
                    right: '20px',
                    maxWidth: '1360px',
                    margin: '0 auto',
                    zIndex: 10000,
                    borderRadius: 'var(--r-xl, 16px)',
                    background: '#f8fafb',
                    boxShadow: '0 30px 80px -15px rgba(9, 30, 43, 0.55)',
                    border: '1px solid rgba(22, 67, 91, 0.22)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }
                : {
                    position: 'fixed',
                    bottom: '92px',
                    right: '24px',
                    width: '460px',
                    maxWidth: 'calc(100vw - 32px)',
                    height: '640px',
                    maxHeight: 'calc(100vh - 116px)',
                    zIndex: 9999,
                    borderRadius: 'var(--r-lg, 14px)',
                    background: '#f8fafb',
                    boxShadow: '0 24px 64px -12px rgba(9, 30, 43, 0.42), 0 0 0 1px rgba(22, 67, 91, 0.12)',
                    border: '1px solid rgba(22, 67, 91, 0.22)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }
            }
          >
            <ChatTab
              source={source}
              fares={fares}
              emtFlights={emtFlights}
              ctFlights={ctFlights}
              isWidget={true}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </>
      )}

      {/* Animation helpers */}
      <style>{`
        @keyframes fadeOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInPill {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulseBeacon {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>
    </>
  );
}

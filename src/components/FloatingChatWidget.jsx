import React, { useState } from 'react';
import { MessageSquare, Sparkles, X, Bot } from 'lucide-react';
import ChatTab from './ChatTab';

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
      {/* Floating Trigger Circle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={isOpen ? 'Close AiRa Assistant' : 'Chat with AiRa Assistant'}
        style={{
          position: 'fixed',
          bottom: '26px',
          right: '26px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0f3347 0%, #16435b 100%)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 8px 24px -2px rgba(15, 51, 71, 0.38), 0 0 0 1px rgba(22, 67, 91, 0.1)',
          zIndex: 9998,
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: isOpen ? 'rotate(90deg)' : 'scale(1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = isOpen ? 'rotate(90deg) scale(1.08)' : 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 12px 28px -2px rgba(15, 51, 71, 0.48), 0 0 14px rgba(22, 67, 91, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = isOpen ? 'rotate(90deg)' : 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 24px -2px rgba(15, 51, 71, 0.38), 0 0 0 1px rgba(22, 67, 91, 0.1)';
        }}
      >
        {isOpen ? (
          <X size={22} strokeWidth={2.4} />
        ) : (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={22} strokeWidth={2.2} />
            {/* Live Indicator Beacon */}
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#34d399',
                border: '2px solid #0f3347',
                boxShadow: '0 0 6px #34d399',
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
                background: 'rgba(15, 51, 71, 0.45)',
                backdropFilter: 'blur(4px)',
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
                    background: '#ffffff',
                    boxShadow: '0 25px 60px -12px rgba(15, 51, 71, 0.45)',
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }
                : {
                    position: 'fixed',
                    bottom: '94px',
                    right: '26px',
                    width: '450px',
                    maxWidth: 'calc(100vw - 36px)',
                    height: '630px',
                    maxHeight: 'calc(100vh - 120px)',
                    zIndex: 9999,
                    borderRadius: 'var(--r-lg, 14px)',
                    background: '#ffffff',
                    boxShadow: '0 20px 48px -10px rgba(15, 51, 71, 0.32), 0 0 0 1px rgba(22, 67, 91, 0.1)',
                    border: '1px solid var(--border)',
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
      `}</style>
    </>
  );
}

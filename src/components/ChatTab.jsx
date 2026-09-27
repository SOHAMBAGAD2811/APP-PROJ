import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Send, Bot, User, AlertCircle, Sparkles, RotateCcw, Copy,
  Check, StopCircle, ArrowUpRight, Scale, Clock, Zap,
  TrendingDown, ChevronDown, CheckCircle2, SlidersHorizontal,
  Maximize2, Minimize2, X, Plane
} from 'lucide-react';
import MarkdownContent from './chat/MarkdownContent';

const DEFAULT_MODELS = [
  { id: 'llama3.2:latest', label: 'Llama 3.2 (Fast · 3.2B)', param_size: '3.2B' },
  { id: 'llama3:latest',   label: 'Llama 3 (Deep · 8.0B)', param_size: '8.0B' },
  { id: 'llama3.2:1b',     label: 'Llama 3.2 1B (Turbo · 1.2B)', param_size: '1.2B' },
];

const STARTER_PROMPTS = [
  {
    icon: Zap,
    title: 'Cheapest Flight',
    prompt: 'What is the absolute cheapest flight available in the current dataset, including carrier and departure timing?',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0'
  },
  {
    icon: Scale,
    title: 'Compare Portals',
    prompt: 'Compare EaseMyTrip vs Google Flights: which platform offers lower prices and where are the biggest fare differences?',
    color: '#0284c7',
    bg: '#f0f9ff',
    border: '#bae6fd'
  },
  {
    icon: Clock,
    title: 'Morning Non-Stop',
    prompt: 'Are there any morning non-stop flights departing before 11:00 AM under ₹7,500?',
    color: '#ea580c',
    bg: '#fff7ed',
    border: '#fed7aa'
  },
  {
    icon: TrendingDown,
    title: 'Shortest Duration',
    prompt: 'Which flight offers the shortest duration to the destination, and how much more does it cost compared to the cheapest option?',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe'
  },
];

export default function ChatTab({
  source = 'both',
  fares = [],
  emtFlights = [],
  ctFlights = [],
  isWidget = false,
  isFullscreen = false,
  onToggleFullscreen,
  onClose,
}) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I am your **AiRA Aviation Intelligence Assistant**. I have real-time access to the flight quotes and DGCA corridor metrics currently in view.\n\nAsk me anything: compare prices between **EaseMyTrip** and **Google Flights**, find the cheapest non-stop departures, or analyze carrier price dispersion.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState(DEFAULT_MODELS);
  const [selectedModel, setSelectedModel] = useState('llama3.2:latest');
  const [modelStatus, setModelStatus] = useState('loading'); // 'ready' | 'loading' | 'offline'
  const [copiedId, setCopiedId] = useState(null);

  const chatContainerRef = useRef(null);
  const isInitialMount = useRef(true);
  const abortControllerRef = useRef(null);
  const textareaRef = useRef(null);

  // Fetch available Ollama models on mount
  useEffect(() => {
    let active = true;
    async function fetchModels() {
      try {
        const res = await fetch('/api/chat/models');
        if (!res.ok) throw new Error('Models endpoint failed');
        const data = await res.json();
        if (active && data.models && data.models.length > 0) {
          setModels(data.models);
          if (data.active) {
            setSelectedModel(data.active);
          }
          setModelStatus(data.status === 'ok' ? 'ready' : 'offline');
        }
      } catch {
        if (active) {
          setModelStatus('offline');
        }
      }
    }
    fetchModels();
    return () => { active = false; };
  }, []);

  // Compute key empirical facts from fares prop to display in context strip
  const contextMeta = useMemo(() => {
    const list = fares.length > 0 ? fares : [...emtFlights, ...ctFlights];
    if (list.length === 0) {
      return { count: 0, minFare: null, minFlight: null, route: null, airlines: 0 };
    }

    let minFare = Infinity;
    let minFlight = null;
    const airlines = new Set();
    let origin = null;
    let dest = null;

    list.forEach(f => {
      const p = parseFloat(f.total_fare || f.base_fare || f.price || 999999);
      if (p < minFare) {
        minFare = p;
        minFlight = f;
      }
      if (f.airline) airlines.add(f.airline);
      if (!origin && (f.origin || f.source_city)) origin = f.origin || f.source_city;
      if (!dest && (f.destination || f.destination_city)) dest = f.destination || f.destination_city;
    });

    return {
      count: list.length,
      minFare: minFare < Infinity ? minFare : null,
      minFlight,
      route: origin && dest ? `${origin} ⇄ ${dest}` : null,
      airlines: airlines.size,
    };
  }, [fares, emtFlights, ctFlights]);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = chatContainerRef.current;
    if (!el) return;
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    scrollToBottom(false);
  }, [messages, scrollToBottom]);

  const handleSend = async (messageText) => {
    const textToSend = typeof messageText === 'string' ? messageText : input;
    if (!textToSend.trim() || loading) return;

    const userMessageId = `user-${Date.now()}`;
    const userMsg = {
      id: userMessageId,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantMessageId = `asst-${Date.now()}`;
    const newMessages = [...messages, userMsg];
    setMessages([...newMessages, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      loading: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);

    setInput('');
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Backend expects the history without the empty placeholder
      const historyPayload = newMessages.map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: historyPayload,
          source: source, // e.g. 'both', 'emt', 'ct'
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let ragHits = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const chunk = JSON.parse(line.slice(6));
            if (chunk.error) throw new Error(chunk.error);

            accumulated += chunk.content || '';
            if (chunk.rag_hits !== undefined) {
              ragHits = chunk.rag_hits;
            }

            setMessages(prev => prev.map(m => {
              if (m.id === assistantMessageId) {
                return {
                  ...m,
                  content: accumulated,
                  loading: !chunk.done,
                  rag_hits: ragHits ?? m.rag_hits,
                };
              }
              return m;
            }));

            if (chunk.done) break;
          } catch (parseErr) {
            // ignore partial JSON parse errors in chunk stream
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setMessages(prev => prev.map(m => {
          if (m.id === assistantMessageId) {
            return {
              ...m,
              content: m.content ? `${m.content}\n\n*(Generation stopped by user)*` : '*(Generation stopped)*',
              loading: false,
            };
          }
          return m;
        }));
      } else {
        setMessages(prev => prev.map(m => {
          if (m.id === assistantMessageId) {
            return {
              ...m,
              isError: true,
              content: `⚠️ **Unable to complete response:** ${err.message}\n\nPlease verify that Ollama is running (\`ollama run llama3.2\`) and accessible on \`localhost:11434\`.`,
              loading: false,
            };
          }
          return m;
        }));
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleClear = () => {
    if (window.confirm('Reset conversation history?')) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setMessages([
        {
          id: 'welcome-reset',
          role: 'assistant',
          content: "Conversation cleared. Ready for your next query on airfares, platform comparison, or market trends!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }
  };

  const handleCopy = (id, content) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const portalBadge = useMemo(() => {
    if (source === 'both') {
      return {
        label: 'Dual Portal (EMT + Google Flights)',
        bg: '#eef6fa',
        color: '#1b6488',
        border: '#cde3ef'
      };
    }
    if (source === 'emt') {
      return {
        label: 'EaseMyTrip Context',
        bg: '#eff6ff',
        color: '#2563eb',
        border: '#bfdbfe'
      };
    }
    return {
      label: 'Google Flights Context',
      bg: '#fdf4ff',
      color: '#a21caf',
      border: '#f5d0fe'
    };
  }, [source]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: isWidget ? '100%' : '680px',
      background: 'var(--bg-surface)',
      borderRadius: isWidget ? 0 : 'var(--radius)',
      border: isWidget ? 'none' : '1px solid var(--border)',
      boxShadow: isWidget ? 'none' : 'var(--shadow-sm)',
      overflow: 'hidden',
    }}>
      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{
        padding: '12px 18px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Left: Branding & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--r-sm)',
            background: 'var(--accent-1)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(22, 67, 91, 0.2)'
          }}>
            <Plane size={18} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                AiRA Flight Intelligence
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '12px',
                background: portalBadge.bg,
                color: portalBadge.color,
                border: `1px solid ${portalBadge.border}`
              }}>
                <Sparkles size={11} />
                {portalBadge.label}
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1px' }}>
              <span>RAG Vector Search & Empirical Quotes</span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: modelStatus === 'offline' ? 'var(--amber)' : '#16a34a'
                }} />
                {modelStatus === 'offline' ? 'Ollama Local Fallback' : 'Ollama Online'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Model Selector & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-subtle)',
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid var(--border)'
          }}>
            <SlidersHorizontal size={13} color="var(--text-muted)" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={loading}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {models.map(m => (
                <option key={m.id} value={m.id}>
                  {m.label || m.id}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleClear}
            disabled={loading}
            title="Reset conversation"
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '6px 10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.76rem',
              color: 'var(--text-secondary)',
              transition: 'background 0.15s ease',
            }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>

          {isWidget && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '2px', borderLeft: '1px solid var(--border)', paddingLeft: '8px' }}>
              {onToggleFullscreen && (
                <button
                  type="button"
                  title={isFullscreen ? 'Restore small window' : 'Full screen'}
                  onClick={onToggleFullscreen}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
              )}
              {onClose && (
                <button
                  type="button"
                  title="Close AiRA Bot"
                  onClick={onClose}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Context Inspector Ribbon ─────────────────────────── */}
      <div style={{
        padding: '6px 18px',
        background: 'var(--bg-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.74rem',
        color: 'var(--text-secondary)',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {contextMeta.route && (
            <span style={{ fontWeight: 600, color: 'var(--accent-1)', background: '#eef5f8', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
              📍 Route: {contextMeta.route}
            </span>
          )}
          <span>
            <strong>{contextMeta.count}</strong> quotes in memory ({contextMeta.airlines} carriers)
          </span>
          {contextMeta.minFare && (
            <span style={{ color: '#166534', background: '#f0fdf4', padding: '2px 6px', borderRadius: '4px', border: '1px solid #bbf7d0', fontWeight: 600 }}>
              Lowest Fare: ₹{contextMeta.minFare.toLocaleString('en-IN')} {contextMeta.minFlight?.airline ? `(${contextMeta.minFlight.airline})` : ''}
            </span>
          )}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
          DGCA FY 24–25 Lowe Index Augmented
        </div>
      </div>

      {/* ── Chat Messages Stream ─────────────────────────────── */}
      <div
        ref={chatContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          background: 'var(--bg-base)',
        }}
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isError = msg.isError;

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                flexDirection: isUser ? 'row-reverse' : 'row',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '8px',
                flexShrink: 0,
                background: isUser ? 'var(--accent-1)' : isError ? 'var(--red-bg)' : '#ffffff',
                border: `1px solid ${isUser ? 'transparent' : isError ? 'var(--red-border)' : 'var(--border)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isUser ? '#ffffff' : isError ? 'var(--red)' : 'var(--accent-1)',
                boxShadow: isUser ? '0 2px 4px rgba(22, 67, 91, 0.2)' : 'var(--shadow-xs)'
              }}>
                {isUser ? <User size={16} /> : isError ? <AlertCircle size={16} /> : <Plane size={16} strokeWidth={2.2} />}
              </div>

              {/* Message Content Container */}
              <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: isUser ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                  background: isUser ? 'var(--accent-1)' : isError ? 'var(--red-bg)' : 'var(--bg-surface)',
                  color: isUser ? '#ffffff' : isError ? 'var(--red-text)' : 'var(--text-primary)',
                  border: isUser ? 'none' : isError ? '1px solid var(--red-border)' : '1px solid var(--border)',
                  boxShadow: isUser ? '0 2px 6px rgba(22, 67, 91, 0.15)' : 'var(--shadow-xs)',
                  fontSize: '0.88rem',
                  lineHeight: '1.6',
                  position: 'relative',
                }}>
                  {msg.loading && !msg.content ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-1)',
                        animation: 'pulse 1.2s ease-in-out infinite'
                      }} />
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-1)',
                        animation: 'pulse 1.2s ease-in-out 0.2s infinite'
                      }} />
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-1)',
                        animation: 'pulse 1.2s ease-in-out 0.4s infinite'
                      }} />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                        Analyzing live flight quotes with {selectedModel}...
                      </span>
                    </div>
                  ) : isUser ? (
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {msg.content}
                    </div>
                  ) : (
                    <MarkdownContent content={msg.content} />
                  )}
                </div>

                {/* Footer metadata row */}
                {!isUser && !msg.loading && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '0 4px',
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                  }}>
                    {msg.rag_hits ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        background: '#eff6fa',
                        color: 'var(--accent-1)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        border: '1px solid #bfdbfe',
                        fontWeight: 600
                      }}>
                        <Sparkles size={10} />
                        {msg.rag_hits} quotes analyzed
                      </span>
                    ) : null}

                    <span>{msg.timestamp}</span>

                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      title="Copy response"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: copiedId === msg.id ? '#16a34a' : 'var(--text-muted)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '2px 4px',
                        borderRadius: '3px',
                      }}
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check size={12} />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Starter Prompts (Pills) ─────────────────────────── */}
      <div style={{
        padding: '8px 18px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
      }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
          Suggestions:
        </span>
        {STARTER_PROMPTS.map((starter, idx) => {
          const IconComponent = starter.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSend(starter.prompt)}
              disabled={loading}
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 11px',
                borderRadius: '16px',
                background: starter.bg,
                border: `1px solid ${starter.border}`,
                color: starter.color,
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <IconComponent size={12} />
              <span>{starter.title}</span>
            </button>
          );
        })}
      </div>

      {/* ── Input Bar ────────────────────────────────────────── */}
      <div style={{
        padding: '12px 18px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-surface)',
      }}>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              ref={textareaRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder={
                source === 'both'
                  ? 'Ask about pricing, timings, or EaseMyTrip vs Google Flights comparison...'
                  : `Ask about current ${source === 'emt' ? 'EaseMyTrip' : 'Google Flights'} fares...`
              }
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-subtle)',
                fontSize: '0.88rem',
                color: 'var(--text-primary)',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {loading ? (
            <button
              type="button"
              onClick={handleStop}
              className="btn"
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                background: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fca5a5',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <StopCircle size={15} />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || loading}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                background: !input.trim() || loading ? 'var(--bg-muted)' : 'var(--accent-1)',
                color: !input.trim() || loading ? 'var(--text-muted)' : '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                boxShadow: !input.trim() || loading ? 'none' : '0 2px 4px rgba(22, 67, 91, 0.2)',
                transition: 'background 0.15s ease',
                flexShrink: 0
              }}
            >
              <span>Send</span>
              <Send size={14} />
            </button>
          )}
        </form>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '7px',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
        }}>
          <span>Press <strong>Enter ↵</strong> to send query · Local RAG pipeline</span>
          <span>Verified against live TimescaleDB quotes & JSON ledger</span>
        </div>
      </div>
    </div>
  );
}

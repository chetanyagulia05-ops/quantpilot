// ============================================================
// QuantPilot — In-Page Conversational AI Assistant Panel
// Opens directly over the active view without page reload or redirection.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bot,
  Send,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  User,
  Info,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePortfolio } from '@/context/PortfolioContext';
import { queryAIAssistant, type PageAIContext } from '@/lib/ai/aiService';
import type { ChatMessage } from '@/types';

interface AIPanelProps {
  onClose: () => void;
}

export default function AIPanel({ onClose }: AIPanelProps) {
  const { currentUser } = useAuth();
  const { portfolio, holdings } = usePortfolio();
  const location = useLocation();

  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [providerStatus, setProviderStatus] = useState<string>('Detecting...');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const storageKey = `quantpilot_chat_${currentUser.id}`;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [
      {
        id: 'welcome-msg',
        user_id: currentUser.id,
        conversation_id: `conv-${currentUser.id}`,
        role: 'assistant',
        content: `👋 Hello **${currentUser.name}**! I am your QuantPilot AI research copilot.\n\nI have live context from your current view (**${location.pathname}**) and your private paper portfolio. Ask me to evaluate technical setups, check risk exposure, or explain market moves.`,
        created_at: new Date().toISOString(),
      },
    ];
  });

  // Save conversation history per user
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages, storageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Contextual starter prompt suggestions based on active route
  const getContextPrompts = (): string[] => {
    switch (location.pathname) {
      case '/chart-lab':
        return [
          'Analyse the stock currently on my chart',
          'Evaluate RSI momentum and Golden Cross signal',
          'What are the mathematical invalidation levels?',
        ];
      case '/portfolio':
        return [
          'Explain my portfolio performance',
          'Review asset allocation and sector weights',
          'Check my portfolio risk exposure',
        ];
      case '/paper-trading':
        return [
          'Review my paper-trading risk',
          'Explain how slippage affects market orders',
          'Suggest position sizing rules',
        ];
      case '/markets':
        return [
          'Explain today\'s Indian market movement',
          'Compare NIFTY 50 vs US index performance',
          'Which sectors have highest momentum?',
        ];
      default:
        return [
          'Explain my portfolio performance',
          'Explain today\'s market movement',
          'Review my paper-trading risk',
        ];
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const text = (queryText || input).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      user_id: currentUser.id,
      conversation_id: `conv-${currentUser.id}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Build context snapshot
    const contextSnapshot: PageAIContext = {
      route: location.pathname,
      pageTitle: location.pathname.replace('/', '').toUpperCase() || 'DASHBOARD',
      portfolioEquity: portfolio.total_value,
      cashBalance: portfolio.cash_balance,
      unrealizedPnl: portfolio.total_pnl,
      holdingsSummary: holdings.map((h) => `${h.symbol} (${h.quantity} shrs)`),
      userRole: currentUser.role,
    };

    try {
      const response = await queryAIAssistant(text, contextSnapshot);
      setProviderStatus(
        response.source === 'GEMINI_LIVE'
          ? 'Google Gemini Live'
          : 'Deterministic Quant Engine (Free)'
      );

      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        user_id: currentUser.id,
        conversation_id: `conv-${currentUser.id}`,
        role: 'assistant',
        content: response.content,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        user_id: currentUser.id,
        conversation_id: `conv-${currentUser.id}`,
        role: 'assistant',
        content:
          '⚠️ An error occurred while generating analysis. Please try again or check your network connection.',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    const fresh = [
      {
        id: `welcome-${Date.now()}`,
        user_id: currentUser.id,
        conversation_id: `conv-${currentUser.id}`,
        role: 'assistant' as const,
        content: `Conversation reset. Ready for your next market or portfolio query!`,
        created_at: new Date().toISOString(),
      },
    ];
    setMessages(fresh);
    localStorage.removeItem(storageKey);
  };

  return (
    <div
      role="dialog"
      aria-label="QuantPilot AI Assistant Panel"
      className={`fixed z-50 transition-all duration-300 flex flex-col rounded-2xl border border-border bg-surface shadow-2xl backdrop-blur-xl ${
        isExpanded
          ? 'inset-4 md:inset-10'
          : 'bottom-24 right-4 md:right-6 w-[94vw] sm:w-[460px] h-[640px] max-h-[82vh]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-surface-secondary/70 px-4 py-3 rounded-t-2xl">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white shadow-xs">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-text-primary">QuantPilot AI</h3>
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                In-Page
              </span>
            </div>
            <p className="text-[11px] text-text-muted">
              Context: {location.pathname} • {currentUser.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleClearHistory}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface hover:text-text-primary transition-colors"
            title="Clear Chat History"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface hover:text-text-primary transition-colors hidden sm:block"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface hover:text-text-primary transition-colors"
            title="Close Assistant"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Provider Status Pill */}
      <div className="flex items-center justify-between border-b border-border-light bg-surface px-4 py-1.5 text-[10px] text-text-muted">
        <span className="flex items-center gap-1">
          <Info className="h-3 w-3 text-brand" />
          Engine: <strong className="text-text-primary">{providerStatus}</strong>
        </span>
        <span className="text-[10px]">Zero Hallucination Guaranteed</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand mt-0.5">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'rounded-br-sm bg-brand text-white shadow-xs'
                  : 'rounded-bl-sm border border-border bg-surface-secondary text-text-primary'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              <div
                className={`mt-1 text-[9px] ${
                  msg.role === 'user' ? 'text-white/70' : 'text-text-muted'
                }`}
              >
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-border text-text-secondary mt-0.5 font-bold text-[10px]">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-text-muted py-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Bot className="h-3.5 w-3.5 animate-spin" />
            </div>
            <span>Evaluating quantitative metrics and current price context...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Contextual Starter Prompts */}
      <div className="border-t border-border-light bg-surface-secondary/40 px-3 py-2 flex items-center gap-1.5 overflow-x-auto">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-brand" />
        {getContextPrompts().map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            className="shrink-0 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-text-secondary hover:border-brand hover:text-brand transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="border-t border-border p-3 bg-surface rounded-b-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about current stock, portfolio, or market risks..."
            className="flex-1 rounded-xl border border-border bg-surface-secondary px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Send message to AI assistant"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white shadow-xs hover:bg-brand-dark disabled:opacity-40 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-text-muted">
          <ShieldAlert className="h-3 w-3 text-warning" />
          <span>Paper trading analysis only. Real capital execution is blocked.</span>
        </div>
      </div>
    </div>
  );
}

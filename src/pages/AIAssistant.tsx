import { useState, useEffect, useRef } from 'react';
import { Bot, Send, ShieldAlert, Sparkles, User, RefreshCw, Loader2 } from 'lucide-react';
import DemoBanner from '@/components/ui/DemoBanner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { usePortfolio } from '@/context/PortfolioContext';
import { queryAIAssistant, type PageAIContext } from '@/lib/ai/aiService';
import type { ChatMessage } from '@/types';

export default function AIAssistant() {
  const { currentUser } = useAuth();
  const { portfolio, holdings, currency } = usePortfolio();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(`quantpilot_chat_${currentUser.id}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'msg-welcome',
        user_id: currentUser.id,
        conversation_id: `conv-${currentUser.id}`,
        role: 'assistant',
        content: `👋 Hello ${currentUser.name}. I am your QuantPilot AI research copilot.

I have full contextual awareness of your isolated paper portfolio (${currency === 'INR' ? '₹' : '$'}${portfolio.total_value.toLocaleString()}, ${holdings.length} active positions) and Indian/global market feeds.

Ask me about:
• Technical setups on RELIANCE, TCS, NIFTY 50 or NVDA
• Portfolio concentration & risk metrics
• Paper trading trade plan modeling`,
        created_at: new Date().toISOString(),
      },
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(`quantpilot_chat_${currentUser.id}`, JSON.stringify(messages));
    } catch {
      // ignore
    }
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentUser.id]);

  const samplePrompts = [
    'Analyze sector allocation risk in my portfolio',
    'What is the technical outlook for RELIANCE and NIFTY 50?',
    'Explain the deterministic equity formula used in paper trading',
    'Calculate risk-reward for a buy order on TCS at ₹4,120',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      user_id: currentUser.id,
      conversation_id: `conv-${currentUser.id}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsGenerating(true);

    try {
      const contextSnapshot: PageAIContext = {
        route: '/ai-assistant',
        pageTitle: 'AI RESEARCH DESK',
        portfolioEquity: portfolio.total_value,
        cashBalance: portfolio.cash_balance,
        unrealizedPnl: portfolio.total_pnl,
        holdingsSummary: holdings.map((h) => `${h.symbol} (${h.quantity} shrs)`),
        userRole: currentUser.role,
      };

      const response = await queryAIAssistant(text, contextSnapshot);

      const assistantMsg: ChatMessage = {
        id: `reply-${Date.now()}`,
        user_id: currentUser.id,
        conversation_id: `conv-${currentUser.id}`,
        role: 'assistant',
        content: response.content,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        user_id: currentUser.id,
        conversation_id: `conv-${currentUser.id}`,
        role: 'assistant',
        content: `Error evaluating query: ${err?.message || 'Unable to generate response'}. Please retry.`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetChat = () => {
    localStorage.removeItem(`quantpilot_chat_${currentUser.id}`);
    setMessages([
      {
        id: `msg-${Date.now()}`,
        user_id: currentUser.id,
        conversation_id: `conv-${currentUser.id}`,
        role: 'assistant',
        content: `Chat session reset for ${currentUser.name}. How can I assist your quant analysis today?`,
        created_at: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">QuantPilot AI Research Engine</h1>
          <p className="text-sm text-text-secondary">
            Financial reasoning, portfolio risk queries, and deterministic quantitative calculations for <span className="font-semibold text-text-primary">{currentUser.name}</span>
          </p>
        </div>
        <Badge variant="brand">Grounded Quant Intelligence</Badge>
      </div>

      {/* Safety & Financial Disclaimer */}
      <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning-light/30 p-4 text-xs text-amber-900 dark:text-amber-200">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div className="space-y-1">
          <p className="font-semibold text-text-primary">Financial & Algorithmic Guardrails:</p>
          <p>
            QuantPilot AI operates under strict risk management principles. It provides educational insights and quantitative scenarios, but{' '}
            <strong>never promises guaranteed returns (e.g. 10% per trade)</strong>. Real market execution carries inherent risk of loss, slippage, and liquidity variance.
          </p>
        </div>
      </div>

      {/* Chat Window */}
      <Card className="flex h-[620px] flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface-secondary px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Grounded Market Agent</p>
              <p className="text-xs text-text-muted">Account: {currentUser.role} • Currency: {currency}</p>
            </div>
          </div>
          <button
            onClick={handleResetChat}
            className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs text-text-muted hover:bg-surface hover:text-text-primary transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Conversation
          </button>
        </div>

        {/* Message scroll area */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'rounded-br-sm bg-brand text-white shadow-sm'
                    : 'rounded-bl-sm border border-border bg-surface-secondary text-text-primary'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div
                  className={`mt-1.5 text-[10px] ${
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
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-border text-text-secondary">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isGenerating && (
            <div className="flex gap-3 items-center text-text-muted text-xs">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand animate-pulse">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1.5 bg-surface-secondary px-3 py-2 rounded-xl border border-border">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
                <span>Formulating grounded quantitative answer...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Quick Prompts */}
        <div className="flex items-center gap-2 overflow-x-auto border-t border-border bg-surface-secondary/50 px-6 py-2.5">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-brand" />
          <span className="text-xs text-text-muted shrink-0">Sample prompts:</span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={isGenerating}
              className="shrink-0 rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-secondary hover:border-brand hover:text-brand transition-colors cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="border-t border-border p-4 bg-surface">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask QuantPilot AI for technical patterns, portfolio risk, or valuation math..."
              disabled={isGenerating}
              className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!inputText.trim() || isGenerating}
              icon={isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            >
              Send
            </Button>
          </form>
          <p className="mt-2 text-center text-[11px] text-text-muted">
            Free tier architecture: Contextual snapshot grounding &gt; Google AI Studio / Offline Quant Engine &gt; Zero-hallucination checks.
          </p>
        </div>
      </Card>
    </div>
  );
}

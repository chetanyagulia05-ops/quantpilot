import { useState } from 'react';
import { Bot, Send, ShieldAlert, Sparkles, User, RefreshCw } from 'lucide-react';
import DemoBanner from '@/components/ui/DemoBanner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { demoChatMessages } from '@/data/demo';
import type { ChatMessage } from '@/types';

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>(demoChatMessages);
  const [inputText, setInputText] = useState('');

  const samplePrompts = [
    'Analyze sector rotation in tech vs defensives',
    'What risk metrics should I apply to paper trading?',
    'Summarize geopolitical catalysts affecting crude oil',
    'Assess drawdown risks on tech portfolio concentration',
  ];

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      user_id: 'demo-user-001',
      conversation_id: 'conv-001',
      role: 'user',
      content: inputText,
      created_at: new Date().toISOString(),
    };

    const simReply: ChatMessage = {
      id: `reply-${Date.now() + 1}`,
      user_id: 'demo-user-001',
      conversation_id: 'conv-001',
      role: 'assistant',
      content: `⚠️ [SIMULATED RESPONSE - DEMO MODE]\n\nYou asked: "${inputText}"\n\nIn future Milestone 5, this will query Google AI Studio (free Gemini API) grounded strictly against verified price data and macroeconomic feeds. The model will enforce strict anti-hallucination bounds, verify all math deterministically, and will never promise fixed percentage returns (e.g. 10% per trade).`,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, simReply]);
    setInputText('');
  };

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">QuantPilot AI Assistant</h1>
        <p className="text-sm text-text-secondary">
          Financial reasoning, portfolio risk queries, and verifiable market intelligence
        </p>
      </div>

      {/* Safety & Financial Disclaimer */}
      <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning-light/30 p-4 text-xs text-amber-900">
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
              <p className="text-sm font-semibold text-text-primary">Market Research Agent</p>
              <p className="text-xs text-text-muted">Powered by Google AI Studio (Free Tier Grounded)</p>
            </div>
          </div>
          <button
            onClick={() => setMessages(demoChatMessages)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-muted hover:bg-surface hover:text-text-primary"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Chat
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
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
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
        </div>

        {/* Quick Prompts */}
        <div className="flex items-center gap-2 overflow-x-auto border-t border-border-light bg-surface-secondary/40 px-6 py-2">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-brand" />
          <span className="text-xs text-text-muted shrink-0">Sample prompts:</span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setInputText(p)}
              className="shrink-0 rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-secondary hover:border-brand hover:text-brand transition-colors"
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
              placeholder="Ask QuantPilot AI for stock insights, valuation math, or macro trends..."
              className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!inputText.trim()}
              icon={<Send className="h-4 w-4" />}
            >
              Send
            </Button>
          </form>
          <p className="mt-2 text-center text-[11px] text-text-muted">
            Free tier architecture: Prompt sanitization &gt; Google AI Studio Gemini API &gt; Anti-hallucination fact checking.
          </p>
        </div>
      </Card>
    </div>
  );
}

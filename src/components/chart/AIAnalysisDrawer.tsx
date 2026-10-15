// ============================================================
// QuantPilot — AI Technical-Analysis Engine & Scenario Panel
// Displays evidence-based directional scenarios, trigger conditions,
// and exact mathematical invalidation price levels.
// ============================================================

import { useState } from 'react';
import {
  Bot,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldAlert,
  Send,
  Layers,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { TechnicalAnalysisReport } from '@/types/chart';
import { formatCurrency } from '@/lib/utils';

interface AIAnalysisDrawerProps {
  report: TechnicalAnalysisReport | null;
  loading: boolean;
  onRunAnalysis: () => void;
  onExecuteCommand: (prompt: string) => void;
}

export default function AIAnalysisDrawer({
  report,
  loading,
  onRunAnalysis,
  onExecuteCommand,
}: AIAnalysisDrawerProps) {
  const [promptInput, setPromptInput] = useState('');

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    onExecuteCommand(promptInput);
    setPromptInput('');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Copilot Natural Language Command Bar */}
      <Card className="p-4 border-brand/20 bg-gradient-to-r from-brand/5 via-surface to-surface">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-white">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">AI Strategy & Technical Copilot</h3>
            <p className="text-[11px] text-text-muted">
              Ask AI to configure indicators or generate scenario invalidation models
            </p>
          </div>
        </div>

        <form onSubmit={handleCommandSubmit} className="flex gap-2 mt-3">
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="e.g. 'Apply Mean Reversion strategy' or 'What are the invalidation levels?'"
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!promptInput.trim() || loading}
            icon={<Send className="h-3.5 w-3.5" />}
          >
            Apply
          </Button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          <span className="text-[10px] text-text-muted">Suggestions:</span>
          <button
            type="button"
            onClick={() => onExecuteCommand('Apply Golden Cross strategy')}
            className="rounded-full bg-surface border border-border px-2.5 py-0.5 text-[11px] text-text-secondary hover:border-brand hover:text-brand"
          >
            Apply Golden Cross
          </button>
          <button
            type="button"
            onClick={() => onExecuteCommand('Enable RSI and Bollinger Bands')}
            className="rounded-full bg-surface border border-border px-2.5 py-0.5 text-[11px] text-text-secondary hover:border-brand hover:text-brand"
          >
            Mean Reversion Presets
          </button>
          <button
            type="button"
            onClick={onRunAnalysis}
            className="rounded-full bg-brand/10 text-brand px-2.5 py-0.5 text-[11px] font-medium hover:bg-brand/20"
          >
            Run Scenario Analysis
          </button>
        </div>
      </Card>

      {/* Analysis Output Section */}
      {report && (
        <div className="space-y-4">
          {/* Executive Summary Card */}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    report.overallBias === 'BULLISH'
                      ? 'gain'
                      : report.overallBias === 'BEARISH'
                      ? 'loss'
                      : 'neutral'
                  }
                  size="md"
                >
                  {report.overallBias === 'BULLISH' && <TrendingUp className="mr-1 h-3.5 w-3.5" />}
                  {report.overallBias === 'BEARISH' && <TrendingDown className="mr-1 h-3.5 w-3.5" />}
                  {report.overallBias === 'NEUTRAL' && <Minus className="mr-1 h-3.5 w-3.5" />}
                  Overall Bias: {report.overallBias}
                </Badge>
                <span className="text-xs font-semibold text-text-secondary">
                  Confidence: {report.confidenceScore}%
                </span>
              </div>
              <span className="text-[11px] text-text-muted">
                Reference Price: {formatCurrency(report.currentPrice)}
              </span>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-text-secondary">
              {report.summary}
            </p>
          </Card>

          {/* Three Scenarios with Invalidation Levels */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* Bullish Scenario */}
            <Card className="border-l-4 border-l-gain">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1 text-xs font-bold text-gain">
                  <TrendingUp className="h-3.5 w-3.5" /> Bullish Case
                </span>
                <Badge variant="gain">{report.scenarios.bullish.probabilityPct}% Prob</Badge>
              </div>
              <h4 className="text-xs font-semibold text-text-primary mb-1">
                {report.scenarios.bullish.title}
              </h4>
              <p className="text-[11px] text-text-secondary mb-3 leading-snug">
                {report.scenarios.bullish.condition}
              </p>

              <div className="space-y-1.5 border-t border-border-light pt-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-text-muted">Upside Target:</span>
                  <span className="font-semibold text-gain">
                    {formatCurrency(report.scenarios.bullish.targetPrice)} (+{report.scenarios.bullish.expectedReturnPct}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Invalidation Level:</span>
                  <span className="font-semibold text-loss">
                    {formatCurrency(report.scenarios.bullish.invalidationPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Risk/Reward:</span>
                  <span className="font-medium text-text-primary">
                    1 : {report.scenarios.bullish.riskRewardRatio}
                  </span>
                </div>
              </div>
            </Card>

            {/* Neutral Scenario */}
            <Card className="border-l-4 border-l-gray-400">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1 text-xs font-bold text-text-secondary">
                  <Minus className="h-3.5 w-3.5" /> Neutral Case
                </span>
                <Badge variant="neutral">{report.scenarios.neutral.probabilityPct}% Prob</Badge>
              </div>
              <h4 className="text-xs font-semibold text-text-primary mb-1">
                {report.scenarios.neutral.title}
              </h4>
              <p className="text-[11px] text-text-secondary mb-3 leading-snug">
                {report.scenarios.neutral.condition}
              </p>

              <div className="space-y-1.5 border-t border-border-light pt-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-text-muted">Consolidation Mid:</span>
                  <span className="font-semibold text-text-primary">
                    {formatCurrency(report.scenarios.neutral.targetPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Breakdown Level:</span>
                  <span className="font-semibold text-loss">
                    {formatCurrency(report.scenarios.neutral.invalidationPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Action:</span>
                  <span className="font-medium text-text-secondary">Patience / Range trade</span>
                </div>
              </div>
            </Card>

            {/* Bearish Scenario */}
            <Card className="border-l-4 border-l-loss">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1 text-xs font-bold text-loss">
                  <TrendingDown className="h-3.5 w-3.5" /> Bearish Case
                </span>
                <Badge variant="loss">{report.scenarios.bearish.probabilityPct}% Prob</Badge>
              </div>
              <h4 className="text-xs font-semibold text-text-primary mb-1">
                {report.scenarios.bearish.title}
              </h4>
              <p className="text-[11px] text-text-secondary mb-3 leading-snug">
                {report.scenarios.bearish.condition}
              </p>

              <div className="space-y-1.5 border-t border-border-light pt-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-text-muted">Downside Target:</span>
                  <span className="font-semibold text-loss">
                    {formatCurrency(report.scenarios.bearish.targetPrice)} ({report.scenarios.bearish.expectedReturnPct}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Invalidation Level:</span>
                  <span className="font-semibold text-gain">
                    {formatCurrency(report.scenarios.bearish.invalidationPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Risk/Reward:</span>
                  <span className="font-medium text-text-primary">
                    1 : {report.scenarios.bearish.riskRewardRatio}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Mathematical Evidence Matrix */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Layers className="h-4 w-4 text-brand" />
              <h4 className="text-xs font-semibold text-text-primary">
                Mathematical Indicator Evidence Matrix
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-[11px] text-text-muted uppercase">
                    <th className="py-2">Indicator</th>
                    <th className="py-2">Calculated Value</th>
                    <th className="py-2">Signal Bias</th>
                    <th className="py-2">Evidence Reasoning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {report.evidence.map((ev, i) => (
                    <tr key={i} className="hover:bg-surface-secondary/40">
                      <td className="py-2.5 font-medium text-text-primary">{ev.indicator}</td>
                      <td className="py-2.5 font-mono text-text-secondary">{ev.currentValue}</td>
                      <td className="py-2.5">
                        <Badge
                          variant={
                            ev.signal === 'BULLISH'
                              ? 'gain'
                              : ev.signal === 'BEARISH'
                              ? 'loss'
                              : 'neutral'
                          }
                        >
                          {ev.signal}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-text-secondary">{ev.reasoning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Support & Resistance Table */}
          {report.supportResistanceLevels.length > 0 && (
            <Card>
              <h4 className="text-xs font-semibold text-text-primary mb-2">
                Identified Support & Resistance Pivot Zones
              </h4>
              <div className="flex flex-wrap gap-2">
                {report.supportResistanceLevels.map((lvl, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs ${
                      lvl.type === 'RESISTANCE'
                        ? 'border-loss/30 bg-loss-light/40 text-loss'
                        : 'border-gain/30 bg-gain-light/40 text-gain'
                    }`}
                  >
                    <span className="font-semibold">{lvl.type}:</span>
                    <span className="font-mono font-bold">${lvl.price.toFixed(2)}</span>
                    <span className="text-[10px] text-text-muted">({lvl.strength}★ touch)</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Safety Disclaimer */}
          <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning-light/30 p-3 text-xs text-amber-900">
            <ShieldAlert className="h-4 w-4 shrink-0 text-warning mt-0.5" />
            <p className="leading-snug">
              <strong>Quant Pilot Risk Disclosure:</strong> All probabilities and invalidation levels are mathematical models derived from calculated indicator geometry. Never risk unmanaged capital. Automated real-money execution is blocked.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

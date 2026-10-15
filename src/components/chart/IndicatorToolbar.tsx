// ============================================================
// QuantPilot — Chart Lab Toolbar & Indicators Manager
// ============================================================

import {
  Sliders,
  CandlestickChart as CandleIcon,
  LineChart as LineIcon,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type { ChartType, IndicatorConfig, Timeframe } from '@/types/chart';

interface IndicatorToolbarProps {
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  chartType: ChartType;
  onChartTypeChange: (ct: ChartType) => void;
  indicators: IndicatorConfig[];
  onToggleIndicator: (id: string) => void;
  onApplyStrategyPreset: (strategy: 'GOLDEN_CROSS' | 'MEAN_REVERSION' | 'MOMENTUM_BREAKOUT') => void;
  onResetIndicators: () => void;
}

const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

export default function IndicatorToolbar({
  timeframe,
  onTimeframeChange,
  chartType,
  onChartTypeChange,
  indicators,
  onToggleIndicator,
  onApplyStrategyPreset,
  onResetIndicators,
}: IndicatorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2.5">
      {/* Left: Timeframe & Chart Style */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg border border-border bg-surface-secondary p-0.5">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                timeframe === tf
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-border mx-1" />

        {/* Chart Mode */}
        <div className="flex items-center rounded-lg border border-border bg-surface-secondary p-0.5">
          <button
            onClick={() => onChartTypeChange('CANDLESTICK')}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              chartType === 'CANDLESTICK'
                ? 'bg-surface text-brand shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            title="Candlestick Chart"
          >
            <CandleIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Candles</span>
          </button>
          <button
            onClick={() => onChartTypeChange('LINE')}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              chartType === 'LINE'
                ? 'bg-surface text-brand shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            title="Line Chart"
          >
            <LineIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Line</span>
          </button>
        </div>
      </div>

      {/* Center: Indicators Quick Toggles */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="flex items-center gap-1 text-xs text-text-muted mr-1">
          <Sliders className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Indicators:</span>
        </span>
        {indicators.map((ind) => (
          <button
            key={ind.id}
            onClick={() => onToggleIndicator(ind.id)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors ${
              ind.enabled
                ? 'border-transparent text-white shadow-xs'
                : 'border-border bg-surface text-text-secondary hover:bg-surface-secondary'
            }`}
            style={{
              backgroundColor: ind.enabled ? ind.color : undefined,
            }}
          >
            {ind.name}
          </button>
        ))}

        <button
          onClick={onResetIndicators}
          className="rounded-full p-1.5 text-text-muted hover:bg-surface-secondary hover:text-text-primary transition-colors"
          title="Reset Indicators"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Right: Strategy Presets */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-brand shrink-0" />
        <span className="text-xs text-text-muted hidden lg:inline">AI Presets:</span>
        <button
          onClick={() => onApplyStrategyPreset('GOLDEN_CROSS')}
          className="rounded-lg border border-brand/30 bg-brand/5 px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand/10 transition-colors"
        >
          Golden Cross
        </button>
        <button
          onClick={() => onApplyStrategyPreset('MEAN_REVERSION')}
          className="rounded-lg border border-brand/30 bg-brand/5 px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand/10 transition-colors"
        >
          Mean Reversion
        </button>
        <button
          onClick={() => onApplyStrategyPreset('MOMENTUM_BREAKOUT')}
          className="rounded-lg border border-brand/30 bg-brand/5 px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand/10 transition-colors"
        >
          Breakout
        </button>
      </div>
    </div>
  );
}

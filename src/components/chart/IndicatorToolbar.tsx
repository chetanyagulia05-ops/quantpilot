// ============================================================
// QuantPilot — Chart Lab Toolbar & Indicators Manager
// Enhanced with Motion SegmentedControl & tactile indicator pills.
// ============================================================

import { motion } from 'motion/react';
import {
  Sliders,
  CandlestickChart as CandleIcon,
  LineChart as LineIcon,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import SegmentedControl from '@/components/ui/SegmentedControl';
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
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-2.5">
      {/* Left: Timeframe & Chart Style */}
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          layoutId="chartlab-timeframe"
          size="sm"
          value={timeframe}
          onChange={onTimeframeChange}
          options={TIMEFRAMES.map((tf) => ({ value: tf, label: tf }))}
        />

        <div className="h-4 w-px bg-border mx-1" />

        <div className="flex items-center rounded-md border border-border bg-secondary/70 p-0.5">
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => onChartTypeChange('CANDLESTICK')}
            className={`flex items-center gap-1 rounded-[5px] px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
              chartType === 'CANDLESTICK'
                ? 'bg-card text-brand shadow-2xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Candlestick Chart"
          >
            <CandleIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Candles</span>
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => onChartTypeChange('LINE')}
            className={`flex items-center gap-1 rounded-[5px] px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
              chartType === 'LINE'
                ? 'bg-card text-brand shadow-2xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Line Chart"
          >
            <LineIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Line</span>
          </motion.button>
        </div>
      </div>

      {/* Center: Indicators Quick Toggles */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground mr-1">
          <Sliders className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Indicators:</span>
        </span>
        {indicators.map((ind) => (
          <motion.button
            key={ind.id}
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => onToggleIndicator(ind.id)}
            className={`rounded-md px-2 py-1 font-mono text-[10px] font-medium border transition-colors cursor-pointer ${
              ind.enabled
                ? 'border-transparent text-white shadow-2xs'
                : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
            }`}
            style={{
              backgroundColor: ind.enabled ? ind.color : undefined,
            }}
          >
            {ind.name}
          </motion.button>
        ))}

        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={onResetIndicators}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
          title="Reset Indicators"
          aria-label="Reset Indicators"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </motion.button>
      </div>

      {/* Right: Strategy Presets */}
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-brand shrink-0" />
        <span className="text-[11px] text-muted-foreground hidden lg:inline">Presets:</span>
        {(
          [
            ['GOLDEN_CROSS', 'Golden Cross'],
            ['MEAN_REVERSION', 'Mean Reversion'],
            ['MOMENTUM_BREAKOUT', 'Breakout'],
          ] as const
        ).map(([key, label]) => (
          <motion.button
            key={key}
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => onApplyStrategyPreset(key)}
            className="rounded-md border border-brand/30 bg-brand/10 px-2 py-1 text-[11px] font-medium text-brand hover:bg-brand/20 transition-colors cursor-pointer"
          >
            {label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

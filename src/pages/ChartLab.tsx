// ============================================================
// QuantPilot — Professional Chart Lab Workspace
// Multi-asset search, interactive candlestick/indicator canvas,
// natural-language AI strategy copilot, and scenario invalidation.
// ============================================================

import { useState, useMemo } from 'react';
import {
  Search,
  BookmarkCheck,
  RefreshCw,
} from 'lucide-react';
import DemoBanner from '@/components/ui/DemoBanner';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CandlestickChart from '@/components/chart/CandlestickChart';
import IndicatorToolbar from '@/components/chart/IndicatorToolbar';
import AIAnalysisDrawer from '@/components/chart/AIAnalysisDrawer';
import {
  SUPPORTED_TICKERS,
  generateCandlesForTicker,
  filterCandlesByTimeframe,
  type TickerInfo,
} from '@/data/ohlcvData';
import {
  computeIndicators,
  generateTechnicalReport,
} from '@/lib/quant/indicators';
import type {
  ChartType,
  IndicatorConfig,
  Timeframe,
  SavedChartLayout,
} from '@/types/chart';
import { formatCurrency, formatPercent, formatVolume } from '@/lib/utils';

// Default Indicator Configuration
const INITIAL_INDICATORS: IndicatorConfig[] = [
  {
    id: 'sma-20',
    type: 'SMA',
    name: 'SMA 20',
    enabled: true,
    pane: 'overlay',
    color: '#3b82f6', // blue
    params: { period: 20 },
  },
  {
    id: 'sma-50',
    type: 'SMA',
    name: 'SMA 50',
    enabled: false,
    pane: 'overlay',
    color: '#f59e0b', // amber
    params: { period: 50 },
  },
  {
    id: 'sma-200',
    type: 'SMA',
    name: 'SMA 200',
    enabled: false,
    pane: 'overlay',
    color: '#ef4444', // red
    params: { period: 200 },
  },
  {
    id: 'ema-21',
    type: 'EMA',
    name: 'EMA 21',
    enabled: false,
    pane: 'overlay',
    color: '#8b5cf6', // purple
    params: { period: 21 },
  },
  {
    id: 'bb-20',
    type: 'BOLLINGER',
    name: 'Bollinger (20,2)',
    enabled: false,
    pane: 'overlay',
    color: '#10b981', // green
    params: { period: 20, stdDev: 2 },
  },
  {
    id: 'rsi-14',
    type: 'RSI',
    name: 'RSI (14)',
    enabled: true,
    pane: 'subplot',
    color: '#6366f1', // brand indigo
    params: { period: 14 },
  },
  {
    id: 'macd-standard',
    type: 'MACD',
    name: 'MACD (12,26,9)',
    enabled: false,
    pane: 'subplot',
    color: '#06b6d4', // cyan
    params: { fast: 12, slow: 26, signal: 9 },
  },
];

export default function ChartLab() {
  const [selectedTicker, setSelectedTicker] = useState<TickerInfo>(SUPPORTED_TICKERS[0]); // NVDA default
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [timeframe, setTimeframe] = useState<Timeframe>(() => {
    try {
      const saved = localStorage.getItem('quantpilot_chart_layout_demo-user-001');
      if (saved) {
        const parsed: SavedChartLayout = JSON.parse(saved);
        if (parsed.timeframe) return parsed.timeframe;
      }
    } catch {
      // fallback
    }
    return '3M';
  });

  const [chartType, setChartType] = useState<ChartType>(() => {
    try {
      const saved = localStorage.getItem('quantpilot_chart_layout_demo-user-001');
      if (saved) {
        const parsed: SavedChartLayout = JSON.parse(saved);
        if (parsed.chartType) return parsed.chartType;
      }
    } catch {
      // fallback
    }
    return 'CANDLESTICK';
  });

  const [indicators, setIndicators] = useState<IndicatorConfig[]>(() => {
    try {
      const saved = localStorage.getItem('quantpilot_chart_layout_demo-user-001');
      if (saved) {
        const parsed: SavedChartLayout = JSON.parse(saved);
        if (parsed.indicators) return parsed.indicators;
      }
    } catch {
      // fallback
    }
    return INITIAL_INDICATORS;
  });

  const [analysisRefreshTrigger, setAnalysisRefreshTrigger] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // 1. Generate Raw Full Candles for Active Ticker
  const rawCandles = useMemo(
    () => generateCandlesForTicker(selectedTicker),
    [selectedTicker]
  );

  // 2. Filter Candles for Selected Timeframe
  const visibleCandles = useMemo(
    () => filterCandlesByTimeframe(rawCandles, timeframe),
    [rawCandles, timeframe]
  );

  // 3. Compute Active Technical Indicators
  const indicatorSeries = useMemo(
    () => computeIndicators(visibleCandles, indicators),
    [visibleCandles, indicators]
  );

  // 4. Derive Technical Analysis Report
  const report = useMemo(() => {
    // analysisRefreshTrigger included in dependency to allow manual refresh
    if (visibleCandles.length < 20 || analysisRefreshTrigger < 0) return null;
    return generateTechnicalReport(
      selectedTicker.symbol,
      timeframe,
      visibleCandles,
      indicators
    );
  }, [selectedTicker.symbol, timeframe, visibleCandles, indicators, analysisRefreshTrigger]);

  const runAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setAnalysisRefreshTrigger((prev) => prev + 1);
      setIsAnalyzing(false);
    }, 150);
  };

  // Save current layout to user account
  const handleSaveLayout = () => {
    const layout: SavedChartLayout = {
      userId: 'demo-user-001',
      symbol: selectedTicker.symbol,
      timeframe,
      chartType,
      indicators,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('quantpilot_chart_layout_demo-user-001', JSON.stringify(layout));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  // Toggle Indicator
  const handleToggleIndicator = (id: string) => {
    setIndicators((prev) =>
      prev.map((ind) => (ind.id === id ? { ...ind, enabled: !ind.enabled } : ind))
    );
  };

  // Reset Indicators
  const handleResetIndicators = () => {
    setIndicators(INITIAL_INDICATORS);
  };

  // Apply Named Strategy Presets
  const handleApplyStrategyPreset = (
    strategy: 'GOLDEN_CROSS' | 'MEAN_REVERSION' | 'MOMENTUM_BREAKOUT'
  ) => {
    setIndicators((prev) =>
      prev.map((ind) => {
        if (strategy === 'GOLDEN_CROSS') {
          return {
            ...ind,
            enabled: ind.id === 'sma-50' || ind.id === 'sma-200',
          };
        }
        if (strategy === 'MEAN_REVERSION') {
          return {
            ...ind,
            enabled: ind.id === 'bb-20' || ind.id === 'rsi-14',
          };
        }
        if (strategy === 'MOMENTUM_BREAKOUT') {
          return {
            ...ind,
            enabled: ind.id === 'ema-21' || ind.id === 'macd-standard',
          };
        }
        return ind;
      })
    );
    // Refresh analysis
    setTimeout(runAnalysis, 100);
  };

  // Natural Language AI Command Parser
  const handleExecuteAICommand = (prompt: string) => {
    const lower = prompt.toLowerCase();

    if (lower.includes('golden cross')) {
      handleApplyStrategyPreset('GOLDEN_CROSS');
    } else if (lower.includes('mean reversion') || lower.includes('bollinger')) {
      handleApplyStrategyPreset('MEAN_REVERSION');
    } else if (lower.includes('breakout') || lower.includes('momentum')) {
      handleApplyStrategyPreset('MOMENTUM_BREAKOUT');
    } else if (lower.includes('rsi') && !lower.includes('macd')) {
      setIndicators((prev) =>
        prev.map((ind) => (ind.id === 'rsi-14' ? { ...ind, enabled: true } : ind))
      );
    } else if (lower.includes('macd')) {
      setIndicators((prev) =>
        prev.map((ind) => (ind.id === 'macd-standard' ? { ...ind, enabled: true } : ind))
      );
    } else if (lower.includes('reset') || lower.includes('clear')) {
      handleResetIndicators();
    }

    runAnalysis();
  };

  // Filter tickers for search modal
  const filteredTickers = useMemo(() => {
    if (!searchQuery.trim()) return SUPPORTED_TICKERS;
    return SUPPORTED_TICKERS.filter(
      (t) =>
        t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.exchange.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Current Quote Math
  const latestCandle = visibleCandles[visibleCandles.length - 1] || {
    close: selectedTicker.basePrice,
    open: selectedTicker.basePrice,
    high: selectedTicker.basePrice,
    low: selectedTicker.basePrice,
    volume: 10000000,
  };
  const prevCandle =
    visibleCandles.length > 1
      ? visibleCandles[visibleCandles.length - 2]
      : latestCandle;
  const quoteChange = latestCandle.close - prevCandle.close;
  const quoteChangePct = (quoteChange / prevCandle.close) * 100;

  return (
    <div className="space-y-5">
      <DemoBanner />

      {/* Header Bar with Symbol Search & Quote */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Symbol Selector Button */}
          <div className="relative">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-left shadow-xs hover:border-brand transition-colors"
            >
              <Search className="h-4 w-4 text-text-muted" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-text-primary">
                    {selectedTicker.symbol}
                  </span>
                  <Badge variant="neutral">{selectedTicker.exchange}</Badge>
                </div>
                <p className="text-[11px] text-text-muted truncate max-w-[140px]">
                  {selectedTicker.name}
                </p>
              </div>
            </button>

            {/* Dropdown Symbol Search List */}
            {isSearchOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-80 rounded-xl border border-border bg-surface p-2 shadow-xl">
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ticker, name, or exchange..."
                  className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <div className="mt-2 max-h-56 overflow-y-auto space-y-1">
                  {filteredTickers.map((t) => (
                    <button
                      key={t.symbol}
                      onClick={() => {
                        setSelectedTicker(t);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-surface-secondary transition-colors"
                    >
                      <div>
                        <span className="font-bold text-text-primary">{t.symbol}</span>
                        <span className="ml-2 text-text-muted">{t.name}</span>
                      </div>
                      <span className="font-mono text-text-secondary">{t.exchange}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live Quote Summary */}
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface px-4 py-2 text-xs">
            <div>
              <span className="text-[10px] text-text-muted block">Current Price</span>
              <span className="text-lg font-bold">
                {formatCurrency(latestCandle.close, selectedTicker.currency)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-text-muted block">24h Net Return</span>
              <span
                className={`font-semibold ${
                  quoteChange >= 0 ? 'text-gain' : 'text-loss'
                }`}
              >
                {quoteChange >= 0 ? '+' : ''}
                {formatCurrency(quoteChange, selectedTicker.currency)} ({formatPercent(quoteChangePct)})
              </span>
            </div>
            <div className="hidden sm:block">
              <span className="text-[10px] text-text-muted block">Session Range</span>
              <span className="font-mono text-text-secondary">
                ${latestCandle.low.toFixed(1)} - ${latestCandle.high.toFixed(1)}
              </span>
            </div>
            <div className="hidden sm:block">
              <span className="text-[10px] text-text-muted block">Volume</span>
              <span className="font-mono text-text-secondary">
                {formatVolume(latestCandle.volume)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-text-muted block">Data Mode</span>
              <Badge variant="warning">High-Res Demo Feed</Badge>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={runAnalysis}
            loading={isAnalyzing}
            icon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh Math
          </Button>

          <Button
            variant={savedNotice ? 'primary' : 'secondary'}
            size="sm"
            onClick={handleSaveLayout}
            icon={<BookmarkCheck className="h-3.5 w-3.5" />}
          >
            {savedNotice ? 'Saved!' : 'Save Layout'}
          </Button>
        </div>
      </div>

      {/* Main Financial Chart Area */}
      <Card className="p-0 overflow-hidden shadow-sm">
        <IndicatorToolbar
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          chartType={chartType}
          onChartTypeChange={setChartType}
          indicators={indicators}
          onToggleIndicator={handleToggleIndicator}
          onApplyStrategyPreset={handleApplyStrategyPreset}
          onResetIndicators={handleResetIndicators}
        />

        <CandlestickChart
          candles={visibleCandles}
          chartType={chartType}
          indicatorSeries={indicatorSeries}
          supportResistanceLevels={report?.supportResistanceLevels}
          currency={selectedTicker.currency}
        />
      </Card>

      {/* AI Technical Analysis & Scenario Invalidation Drawer */}
      <AIAnalysisDrawer
        report={report}
        loading={isAnalyzing}
        onRunAnalysis={runAnalysis}
        onExecuteCommand={handleExecuteAICommand}
      />
    </div>
  );
}

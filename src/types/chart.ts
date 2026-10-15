// ============================================================
// QuantPilot — Chart Lab Domain Types
// ============================================================

export interface CandleData {
  timestamp: number; // Unix timestamp in seconds
  date: string;      // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type IndicatorType =
  | 'SMA'
  | 'EMA'
  | 'BOLLINGER'
  | 'RSI'
  | 'MACD'
  | 'SUPPORT_RESISTANCE';

export type PaneType = 'overlay' | 'subplot';

export interface IndicatorConfig {
  id: string;
  type: IndicatorType;
  name: string;
  enabled: boolean;
  pane: PaneType;
  color: string;
  params: Record<string, number>;
}

export interface IndicatorSeries {
  id: string;
  name: string;
  pane: PaneType;
  color: string;
  values: (number | null)[];
  secondaryValues?: (number | null)[]; // e.g. signal line in MACD, lower band in Bollinger
  tertiaryValues?: (number | null)[];  // e.g. histogram in MACD, upper band in Bollinger
}

export interface SupportResistanceLevel {
  type: 'SUPPORT' | 'RESISTANCE';
  price: number;
  strength: number; // 1 to 5 based on touch count
  description: string;
}

export interface ScenarioBreakdown {
  bias: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  probabilityPct: number;
  title: string;
  condition: string;
  targetPrice: number;
  invalidationPrice: number;
  expectedReturnPct: number;
  riskRewardRatio: number;
}

export interface IndicatorEvidence {
  indicator: string;
  currentValue: string;
  signal: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  reasoning: string;
}

export interface TechnicalAnalysisReport {
  symbol: string;
  timeframe: string;
  currentPrice: number;
  overallBias: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  confidenceScore: number; // 0 - 100
  summary: string;
  scenarios: {
    bullish: ScenarioBreakdown;
    neutral: ScenarioBreakdown;
    bearish: ScenarioBreakdown;
  };
  evidence: IndicatorEvidence[];
  supportResistanceLevels: SupportResistanceLevel[];
  generatedAt: string;
  disclaimer: string;
}

export type ChartType = 'CANDLESTICK' | 'LINE';

export type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

export interface SavedChartLayout {
  userId: string;
  symbol: string;
  timeframe: Timeframe;
  chartType: ChartType;
  indicators: IndicatorConfig[];
  updatedAt: string;
}

// ============================================================
// QuantPilot — Deterministic Technical Indicators Engine
// Strictly mathematical calculations with zero hallucination.
// ============================================================

import type {
  CandleData,
  IndicatorConfig,
  IndicatorSeries,
  SupportResistanceLevel,
  TechnicalAnalysisReport,
  IndicatorEvidence,
  ScenarioBreakdown,
} from '@/types/chart';

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(
  candles: CandleData[],
  period: number
): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  result[period - 1] = Number((sum / period).toFixed(2));

  for (let i = period; i < candles.length; i++) {
    sum += candles[i].close - candles[i - period].close;
    result[i] = Number((sum / period).toFixed(2));
  }

  return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(
  candles: CandleData[],
  period: number
): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length < period) return result;

  const k = 2 / (period + 1);

  // Initialize with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  let prevEma = sum / period;
  result[period - 1] = Number(prevEma.toFixed(2));

  for (let i = period; i < candles.length; i++) {
    const currentEma = candles[i].close * k + prevEma * (1 - k);
    result[i] = Number(currentEma.toFixed(2));
    prevEma = currentEma;
  }

  return result;
}

/**
 * Calculate Bollinger Bands (Middle, Upper, Lower)
 */
export function calculateBollingerBands(
  candles: CandleData[],
  period = 20,
  stdDevMultiplier = 2
): {
  middle: (number | null)[];
  upper: (number | null)[];
  lower: (number | null)[];
} {
  const middle = calculateSMA(candles, period);
  const upper: (number | null)[] = new Array(candles.length).fill(null);
  const lower: (number | null)[] = new Array(candles.length).fill(null);

  for (let i = period - 1; i < candles.length; i++) {
    const mid = middle[i];
    if (mid === null) continue;

    let varianceSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      varianceSum += Math.pow(candles[j].close - mid, 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);
    upper[i] = Number((mid + stdDevMultiplier * stdDev).toFixed(2));
    lower[i] = Number((mid - stdDevMultiplier * stdDev).toFixed(2));
  }

  return { middle, upper, lower };
}

/**
 * Calculate Relative Strength Index (RSI - Wilder's Smoothing)
 */
export function calculateRSI(
  candles: CandleData[],
  period = 14
): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length <= period) return result;

  let gainSum = 0;
  let lossSum = 0;

  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change >= 0) gainSum += change;
    else lossSum += Math.abs(change);
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  if (avgLoss === 0) {
    result[period] = 100;
  } else {
    const rs = avgGain / avgLoss;
    result[period] = Number((100 - 100 / (1 + rs)).toFixed(2));
  }

  for (let i = period + 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    const currentGain = change >= 0 ? change : 0;
    const currentLoss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[i] = Number((100 - 100 / (1 + rs)).toFixed(2));
    }
  }

  return result;
}

/**
 * Calculate Moving Average Convergence Divergence (MACD)
 */
export function calculateMACD(
  candles: CandleData[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
} {
  const fastEMA = calculateEMA(candles, fastPeriod);
  const slowEMA = calculateEMA(candles, slowPeriod);

  const macd: (number | null)[] = new Array(candles.length).fill(null);
  for (let i = slowPeriod - 1; i < candles.length; i++) {
    if (fastEMA[i] !== null && slowEMA[i] !== null) {
      macd[i] = Number((fastEMA[i]! - slowEMA[i]!).toFixed(2));
    }
  }

  // Calculate Signal line (EMA of MACD)
  const signal: (number | null)[] = new Array(candles.length).fill(null);
  const histogram: (number | null)[] = new Array(candles.length).fill(null);

  // Collect valid MACD points
  const validMacdEntries: { index: number; val: number }[] = [];
  for (let i = 0; i < macd.length; i++) {
    if (macd[i] !== null) validMacdEntries.push({ index: i, val: macd[i]! });
  }

  if (validMacdEntries.length >= signalPeriod) {
    const k = 2 / (signalPeriod + 1);
    let sum = 0;
    for (let i = 0; i < signalPeriod; i++) {
      sum += validMacdEntries[i].val;
    }
    let prevSig = sum / signalPeriod;
    const startIdx = validMacdEntries[signalPeriod - 1].index;
    signal[startIdx] = Number(prevSig.toFixed(2));
    histogram[startIdx] = Number((macd[startIdx]! - prevSig).toFixed(2));

    for (let i = signalPeriod; i < validMacdEntries.length; i++) {
      const currMacd = validMacdEntries[i].val;
      const currIdx = validMacdEntries[i].index;
      const currSig = currMacd * k + prevSig * (1 - k);
      signal[currIdx] = Number(currSig.toFixed(2));
      histogram[currIdx] = Number((currMacd - currSig).toFixed(2));
      prevSig = currSig;
    }
  }

  return { macd, signal, histogram };
}

/**
 * Identify Key Support and Resistance Levels via swing pivots
 */
export function calculateSupportResistance(
  candles: CandleData[],
  windowSize = 5,
  currencySymbol = '₹'
): SupportResistanceLevel[] {
  if (candles.length < windowSize * 2) return [];

  const rawPivots: { type: 'SUPPORT' | 'RESISTANCE'; price: number }[] = [];

  for (let i = windowSize; i < candles.length - windowSize; i++) {
    const currentHigh = candles[i].high;
    const currentLow = candles[i].low;

    let isHigh = true;
    let isLow = true;

    for (let j = i - windowSize; j <= i + windowSize; j++) {
      if (j === i) continue;
      if (candles[j].high > currentHigh) isHigh = false;
      if (candles[j].low < currentLow) isLow = false;
    }

    if (isHigh) rawPivots.push({ type: 'RESISTANCE', price: currentHigh });
    if (isLow) rawPivots.push({ type: 'SUPPORT', price: currentLow });
  }

  // Cluster nearby levels (within 1.5% range)
  const currentPrice = candles[candles.length - 1].close;
  const clustered: SupportResistanceLevel[] = [];

  const sortedPivots = [...rawPivots].sort((a, b) => a.price - b.price);

  for (const pivot of sortedPivots) {
    const existing = clustered.find(
      (c) => Math.abs(c.price - pivot.price) / pivot.price < 0.015 && c.type === pivot.type
    );
    if (existing) {
      existing.strength = Math.min(5, existing.strength + 1);
      existing.price = Number(((existing.price + pivot.price) / 2).toFixed(2));
    } else {
      clustered.push({
        type: pivot.type,
        price: Number(pivot.price.toFixed(2)),
        strength: 1,
        description:
          pivot.price > currentPrice
            ? `Resistance cluster near ${currencySymbol}${pivot.price.toFixed(2)}`
            : `Support cluster near ${currencySymbol}${pivot.price.toFixed(2)}`,
      });
    }
  }

  // Filter to significant levels near the current price
  return clustered
    .filter((lvl) => Math.abs(lvl.price - currentPrice) / currentPrice < 0.25)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 6)
    .sort((a, b) => b.price - a.price);
}

/**
 * Execute calculation pipeline for all enabled indicators
 */
export function computeIndicators(
  candles: CandleData[],
  configs: IndicatorConfig[]
): IndicatorSeries[] {
  const seriesList: IndicatorSeries[] = [];

  for (const cfg of configs) {
    if (!cfg.enabled) continue;

    switch (cfg.type) {
      case 'SMA': {
        const period = cfg.params.period || 20;
        const vals = calculateSMA(candles, period);
        seriesList.push({
          id: cfg.id,
          name: `SMA (${period})`,
          pane: 'overlay',
          color: cfg.color,
          values: vals,
        });
        break;
      }
      case 'EMA': {
        const period = cfg.params.period || 21;
        const vals = calculateEMA(candles, period);
        seriesList.push({
          id: cfg.id,
          name: `EMA (${period})`,
          pane: 'overlay',
          color: cfg.color,
          values: vals,
        });
        break;
      }
      case 'BOLLINGER': {
        const period = cfg.params.period || 20;
        const stdDev = cfg.params.stdDev || 2;
        const bb = calculateBollingerBands(candles, period, stdDev);
        seriesList.push({
          id: cfg.id,
          name: `BB Upper (${period}, ${stdDev})`,
          pane: 'overlay',
          color: cfg.color,
          values: bb.upper,
          secondaryValues: bb.lower,
          tertiaryValues: bb.middle,
        });
        break;
      }
      case 'RSI': {
        const period = cfg.params.period || 14;
        const rsiVals = calculateRSI(candles, period);
        seriesList.push({
          id: cfg.id,
          name: `RSI (${period})`,
          pane: 'subplot',
          color: cfg.color,
          values: rsiVals,
        });
        break;
      }
      case 'MACD': {
        const fast = cfg.params.fast || 12;
        const slow = cfg.params.slow || 26;
        const signal = cfg.params.signal || 9;
        const m = calculateMACD(candles, fast, slow, signal);
        seriesList.push({
          id: cfg.id,
          name: `MACD (${fast}, ${slow}, ${signal})`,
          pane: 'subplot',
          color: cfg.color,
          values: m.macd,
          secondaryValues: m.signal,
          tertiaryValues: m.histogram,
        });
        break;
      }
      default:
        break;
    }
  }

  return seriesList;
}

/**
 * Generate evidence-based Technical Analysis Report with Invalidation Levels
 */
export function generateTechnicalReport(
  symbol: string,
  timeframe: string,
  candles: CandleData[],
  _configs?: IndicatorConfig[],
  currency: string = 'INR'
): TechnicalAnalysisReport {
  if (candles.length < 20) {
    throw new Error('Insufficient candles for quantitative analysis');
  }

  const sym = currency === 'INR' ? '₹' : '$';
  const lastCandle = candles[candles.length - 1];
  const currentPrice = lastCandle.close;

  // Compute key indicators for evaluation
  const sma20 = calculateSMA(candles, 20);
  const sma50 = calculateSMA(candles, 50);
  const sma200 = calculateSMA(candles, Math.min(200, Math.floor(candles.length * 0.9)));
  const rsi = calculateRSI(candles, 14);
  const macd = calculateMACD(candles, 12, 26, 9);
  const bb = calculateBollingerBands(candles, 20, 2);
  const srLevels = calculateSupportResistance(candles, 5, sym);

  const lastIdx = candles.length - 1;
  const currentRSI = rsi[lastIdx] ?? 50;
  const currentSMA20 = sma20[lastIdx] ?? currentPrice;
  const currentSMA50 = sma50[lastIdx] ?? currentPrice;
  const currentSMA200 = sma200[lastIdx] ?? currentPrice;
  const currentMacd = macd.macd[lastIdx] ?? 0;
  const currentSignal = macd.signal[lastIdx] ?? 0;
  const currentBBUpper = bb.upper[lastIdx] ?? currentPrice * 1.05;
  const currentBBLower = bb.lower[lastIdx] ?? currentPrice * 0.95;

  const evidence: IndicatorEvidence[] = [];
  let score = 0; // -100 to +100

  // 1. Moving Average Trend Evaluation
  if (currentPrice > currentSMA50 && currentSMA50 > currentSMA200) {
    evidence.push({
      indicator: 'Moving Average Alignment',
      currentValue: `Price (${sym}${currentPrice.toFixed(2)}) > SMA50 (${sym}${currentSMA50.toFixed(2)}) > SMA200 (${sym}${currentSMA200.toFixed(2)})`,
      signal: 'BULLISH',
      reasoning: 'Bullish moving average stack indicates dominant upward macro trend.',
    });
    score += 30;
  } else if (currentPrice < currentSMA50 && currentSMA50 < currentSMA200) {
    evidence.push({
      indicator: 'Moving Average Alignment',
      currentValue: `Price (${sym}${currentPrice.toFixed(2)}) < SMA50 (${sym}${currentSMA50.toFixed(2)}) < SMA200 (${sym}${currentSMA200.toFixed(2)})`,
      signal: 'BEARISH',
      reasoning: 'Bearish stack indicates dominant downward trend pressure.',
    });
    score -= 30;
  } else {
    evidence.push({
      indicator: 'Moving Average Alignment',
      currentValue: `Price: ${sym}${currentPrice.toFixed(2)}, SMA50: ${sym}${currentSMA50.toFixed(2)}`,
      signal: 'NEUTRAL',
      reasoning: 'Price consolidating between major moving averages.',
    });
  }

  // 2. RSI Momentum
  if (currentRSI >= 70) {
    evidence.push({
      indicator: 'RSI (14)',
      currentValue: `${currentRSI.toFixed(1)}`,
      signal: 'BEARISH',
      reasoning: 'Overbought territory (>70). High risk of mean-reversion pullback.',
    });
    score -= 20;
  } else if (currentRSI <= 30) {
    evidence.push({
      indicator: 'RSI (14)',
      currentValue: `${currentRSI.toFixed(1)}`,
      signal: 'BULLISH',
      reasoning: 'Oversold condition (<30). Exhaustion of selling pressure.',
    });
    score += 20;
  } else if (currentRSI > 50) {
    evidence.push({
      indicator: 'RSI (14)',
      currentValue: `${currentRSI.toFixed(1)}`,
      signal: 'BULLISH',
      reasoning: 'Positive momentum above 50 midline supporting upward drift.',
    });
    score += 15;
  } else {
    evidence.push({
      indicator: 'RSI (14)',
      currentValue: `${currentRSI.toFixed(1)}`,
      signal: 'BEARISH',
      reasoning: 'Negative momentum below 50 midline with weaker buyers.',
    });
    score -= 15;
  }

  // 3. MACD Momentum
  if (currentMacd > currentSignal) {
    evidence.push({
      indicator: 'MACD (12, 26, 9)',
      currentValue: `MACD ${currentMacd.toFixed(2)} > Signal ${currentSignal.toFixed(2)}`,
      signal: 'BULLISH',
      reasoning: 'Bullish MACD crossover confirms positive short-term momentum.',
    });
    score += 25;
  } else {
    evidence.push({
      indicator: 'MACD (12, 26, 9)',
      currentValue: `MACD ${currentMacd.toFixed(2)} < Signal ${currentSignal.toFixed(2)}`,
      signal: 'BEARISH',
      reasoning: 'Bearish MACD signal line rejection shows expanding downward momentum.',
    });
    score -= 25;
  }

  // 4. Bollinger Band Volatility
  if (currentPrice >= currentBBUpper * 0.98) {
    evidence.push({
      indicator: 'Bollinger Bands (20, 2)',
      currentValue: `Upper Band: ${sym}${currentBBUpper.toFixed(2)}`,
      signal: 'NEUTRAL',
      reasoning: 'Testing upper volatility envelope. Watch for breakout expansion or reversal.',
    });
  } else if (currentPrice <= currentBBLower * 1.02) {
    evidence.push({
      indicator: 'Bollinger Bands (20, 2)',
      currentValue: `Lower Band: ${sym}${currentBBLower.toFixed(2)}`,
      signal: 'BULLISH',
      reasoning: 'Testing lower volatility threshold with potential mean-reversion bounce.',
    });
    score += 10;
  }

  // Find nearest support & resistance
  const nearestResistance =
    srLevels.find((l) => l.type === 'RESISTANCE' && l.price > currentPrice)?.price ??
    Number((currentPrice * 1.06).toFixed(2));

  const nearestSupport =
    srLevels.find((l) => l.type === 'SUPPORT' && l.price < currentPrice)?.price ??
    Number((currentPrice * 0.94).toFixed(2));

  // Determine Overall Bias
  let overallBias: 'BULLISH' | 'NEUTRAL' | 'BEARISH' = 'NEUTRAL';
  if (score >= 25) overallBias = 'BULLISH';
  else if (score <= -25) overallBias = 'BEARISH';

  const confidenceScore = Math.min(95, Math.max(50, 50 + Math.abs(score) / 2));

  // Scenario 1: Bullish Scenario with Invalidation
  const bullishTarget = Number((nearestResistance * 1.02).toFixed(2));
  const bullishInvalidation = Number((nearestSupport * 0.99).toFixed(2));
  const bullishReturn = Number((((bullishTarget - currentPrice) / currentPrice) * 100).toFixed(2));
  const bullishRisk = Number((((currentPrice - bullishInvalidation) / currentPrice) * 100).toFixed(2));
  const bullishRR = Number((bullishReturn / Math.max(0.1, bullishRisk)).toFixed(2));

  const bullishScenario: ScenarioBreakdown = {
    bias: 'BULLISH',
    probabilityPct: overallBias === 'BULLISH' ? 62 : overallBias === 'NEUTRAL' ? 35 : 18,
    title: 'Upward Momentum Continuation',
    condition: `Sustained breakout and close above 20-period moving average (${sym}${currentSMA20.toFixed(2)}) with expanding volume.`,
    targetPrice: bullishTarget,
    invalidationPrice: bullishInvalidation,
    expectedReturnPct: bullishReturn,
    riskRewardRatio: bullishRR,
  };

  // Scenario 2: Neutral Scenario
  const neutralScenario: ScenarioBreakdown = {
    bias: 'NEUTRAL',
    probabilityPct: overallBias === 'NEUTRAL' ? 50 : 25,
    title: 'Range-Bound Consolidation',
    condition: `Price oscillates between primary support (${sym}${nearestSupport.toFixed(2)}) and primary resistance (${sym}${nearestResistance.toFixed(2)}).`,
    targetPrice: Number(((nearestSupport + nearestResistance) / 2).toFixed(2)),
    invalidationPrice: Number((nearestSupport * 0.97).toFixed(2)),
    expectedReturnPct: 0.0,
    riskRewardRatio: 1.0,
  };

  // Scenario 3: Bearish Scenario with Invalidation
  const bearishTarget = Number((nearestSupport * 0.97).toFixed(2));
  const bearishInvalidation = Number((nearestResistance * 1.01).toFixed(2));
  const bearishDrop = Number((((currentPrice - bearishTarget) / currentPrice) * 100).toFixed(2));
  const bearishRisk = Number((((bearishInvalidation - currentPrice) / currentPrice) * 100).toFixed(2));
  const bearishRR = Number((bearishDrop / Math.max(0.1, bearishRisk)).toFixed(2));

  const bearishScenario: ScenarioBreakdown = {
    bias: 'BEARISH',
    probabilityPct: overallBias === 'BEARISH' ? 64 : overallBias === 'NEUTRAL' ? 35 : 18,
    title: 'Support Breakdown & Liquidity Sweep',
    condition: `Decisive breach below support at ${sym}${nearestSupport.toFixed(2)} accompanied by high selling volume.`,
    targetPrice: bearishTarget,
    invalidationPrice: bearishInvalidation,
    expectedReturnPct: -bearishDrop,
    riskRewardRatio: bearishRR,
  };

  const summary =
    overallBias === 'BULLISH'
      ? `${symbol} displays constructive bullish structure on the ${timeframe} timeframe. Momentum indicators (RSI ${currentRSI.toFixed(1)}, MACD) corroborate upward continuation toward resistance at ${sym}${nearestResistance.toFixed(2)}. Invalidation level sits strictly at ${sym}${bullishInvalidation.toFixed(2)}.`
      : overallBias === 'BEARISH'
      ? `${symbol} is under technical distribution pressure on the ${timeframe} timeframe. Selling momentum dominates, targeting support near ${sym}${nearestSupport.toFixed(2)}. Scenario invalidates on a clean close above ${sym}${bearishInvalidation.toFixed(2)}.`
      : `${symbol} exhibits neutral equilibrium on the ${timeframe} timeframe. Indicators reflect range-bound consolidation between ${sym}${nearestSupport.toFixed(2)} and ${sym}${nearestResistance.toFixed(2)}. Breakout confirmation required before directional commitment.`;

  return {
    symbol,
    timeframe,
    currentPrice,
    overallBias,
    confidenceScore: Math.round(confidenceScore),
    summary,
    scenarios: {
      bullish: bullishScenario,
      neutral: neutralScenario,
      bearish: bearishScenario,
    },
    evidence,
    supportResistanceLevels: srLevels,
    generatedAt: new Date().toISOString(),
    disclaimer:
      'Quantitative model output for paper research only. Invalidation levels define mathematical thesis invalidation and do not constitute trading advice.',
  };
}

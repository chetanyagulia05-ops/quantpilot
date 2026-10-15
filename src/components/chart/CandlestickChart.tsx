// ============================================================
// QuantPilot — Professional Financial Multi-Pane Chart
// High-performance canvas-based financial candlestick renderer
// with volume bars, indicator overlays, subplots, and crosshairs.
// ============================================================

import { useEffect, useRef, useState, useMemo } from 'react';
import type {
  CandleData,
  ChartType,
  IndicatorSeries,
  SupportResistanceLevel,
} from '@/types/chart';
import { formatCurrency, formatVolume } from '@/lib/utils';

interface CandlestickChartProps {
  candles: CandleData[];
  chartType: ChartType;
  indicatorSeries: IndicatorSeries[];
  supportResistanceLevels?: SupportResistanceLevel[];
  currency?: string;
}

export default function CandlestickChart({
  candles,
  chartType,
  indicatorSeries,
  supportResistanceLevels = [],
  currency = 'USD',
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [crosshairY, setCrosshairY] = useState<number | null>(null);

  // Group indicators by pane
  const overlaySeries = useMemo(
    () => indicatorSeries.filter((s) => s.pane === 'overlay'),
    [indicatorSeries]
  );
  const subplotSeries = useMemo(
    () => indicatorSeries.filter((s) => s.pane === 'subplot'),
    [indicatorSeries]
  );

  const hasSubplot = subplotSeries.length > 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI retina displays
    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = 520;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    // Layout configuration
    const paddingRight = 65;
    const paddingLeft = 10;
    const paddingTop = 25;
    const paddingBottom = 20;

    const chartWidth = width - paddingLeft - paddingRight;

    // Pane vertical splits
    let mainPaneHeight: number;
    let volumePaneHeight: number;
    let subplotPaneHeight = 0;

    if (hasSubplot) {
      mainPaneHeight = Math.floor(height * 0.58);
      volumePaneHeight = Math.floor(height * 0.15);
      subplotPaneHeight = height - mainPaneHeight - volumePaneHeight - paddingTop - paddingBottom;
    } else {
      mainPaneHeight = Math.floor(height * 0.72);
      volumePaneHeight = height - mainPaneHeight - paddingTop - paddingBottom;
    }

    const volumeTop = paddingTop + mainPaneHeight + 10;
    const subplotTop = volumeTop + volumePaneHeight + 10;

    // 1. Calculate Price Scales (Min & Max)
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    candles.forEach((c) => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVolume) maxVolume = c.volume;
    });

    // Factor overlay indicators into price bounds
    overlaySeries.forEach((s) => {
      s.values.forEach((v) => {
        if (v !== null) {
          if (v < minPrice) minPrice = v;
          if (v > maxPrice) maxPrice = v;
        }
      });
      if (s.secondaryValues) {
        s.secondaryValues.forEach((v) => {
          if (v !== null) {
            if (v < minPrice) minPrice = v;
            if (v > maxPrice) maxPrice = v;
          }
        });
      }
    });

    // Add 4% buffer to price range
    const priceRange = Math.max(1, maxPrice - minPrice);
    minPrice -= priceRange * 0.04;
    maxPrice += priceRange * 0.04;

    const priceToY = (price: number) =>
      paddingTop + (1 - (price - minPrice) / (maxPrice - minPrice)) * mainPaneHeight;

    const candleCount = candles.length;
    const candleWidth = Math.max(2, (chartWidth / candleCount) * 0.7);
    const candleSpacing = chartWidth / candleCount;

    const indexToX = (index: number) =>
      paddingLeft + index * candleSpacing + candleSpacing / 2;

    // --- RENDER BACKGROUND & GRID ---
    ctx.clearRect(0, 0, width, height);

    // Horizontal Price Grid Lines
    const gridLines = 5;
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'left';

    for (let i = 0; i <= gridLines; i++) {
      const priceVal = minPrice + (priceRange / gridLines) * i;
      const y = priceToY(priceVal);

      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      ctx.fillText(formatCurrency(priceVal, currency), width - paddingRight + 6, y + 3);
    }

    // Support & Resistance Lines
    supportResistanceLevels.forEach((sr) => {
      if (sr.price >= minPrice && sr.price <= maxPrice) {
        const y = priceToY(sr.price);
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = sr.type === 'RESISTANCE' ? '#f87171' : '#34d399';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(width - paddingRight, y);
        ctx.stroke();

        // Level tag
        ctx.fillStyle = sr.type === 'RESISTANCE' ? '#ef4444' : '#10b981';
        ctx.fillRect(width - paddingRight, y - 8, paddingRight - 4, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(`$${sr.price.toFixed(1)}`, width - paddingRight + 4, y + 4);
        ctx.restore();
      }
    });

    // --- RENDER CANDLES / LINE ---
    if (chartType === 'CANDLESTICK') {
      candles.forEach((c, idx) => {
        const x = indexToX(idx);
        const openY = priceToY(c.open);
        const closeY = priceToY(c.close);
        const highY = priceToY(c.high);
        const lowY = priceToY(c.low);

        const isGreen = c.close >= c.open;
        const color = isGreen ? '#10b981' : '#ef4444';

        // Draw Wick
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Draw Candle Body
        const topY = Math.min(openY, closeY);
        const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));
        ctx.fillStyle = color;
        ctx.fillRect(x - candleWidth / 2, topY, candleWidth, bodyHeight);
      });
    } else {
      // Line Mode
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      candles.forEach((c, idx) => {
        const x = indexToX(idx);
        const y = priceToY(c.close);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // --- RENDER OVERLAY INDICATORS (SMA, EMA, Bollinger) ---
    overlaySeries.forEach((series) => {
      // Primary Line (e.g. SMA, EMA, BB Upper)
      ctx.strokeStyle = series.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;

      series.values.forEach((val, idx) => {
        if (val !== null && idx < candles.length) {
          const x = indexToX(idx);
          const y = priceToY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();

      // Secondary & Tertiary Lines (e.g. Bollinger Lower & Middle)
      if (series.secondaryValues) {
        ctx.strokeStyle = series.color;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        let sStarted = false;
        series.secondaryValues.forEach((val, idx) => {
          if (val !== null && idx < candles.length) {
            const x = indexToX(idx);
            const y = priceToY(val);
            if (!sStarted) {
              ctx.moveTo(x, y);
              sStarted = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // --- RENDER VOLUME PANE ---
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(paddingLeft, volumeTop);
    ctx.lineTo(width - paddingRight, volumeTop);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Volume', paddingLeft, volumeTop - 4);

    candles.forEach((c, idx) => {
      const x = indexToX(idx);
      const isGreen = c.close >= c.open;
      const barHeight = maxVolume > 0 ? (c.volume / maxVolume) * (volumePaneHeight - 10) : 0;
      const y = volumeTop + volumePaneHeight - barHeight;

      ctx.fillStyle = isGreen ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';
      ctx.fillRect(x - candleWidth / 2, y, candleWidth, barHeight);
    });

    // --- RENDER SUBPLOT (RSI / MACD) ---
    if (hasSubplot) {
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(paddingLeft, subplotTop);
      ctx.lineTo(width - paddingRight, subplotTop);
      ctx.stroke();

      subplotSeries.forEach((series) => {
        if (series.name.startsWith('RSI')) {
          ctx.fillStyle = '#94a3b8';
          ctx.fillText('RSI (14)', paddingLeft, subplotTop - 4);

          // 70 / 30 reference lines
          const rsiY70 = subplotTop + (1 - 70 / 100) * subplotPaneHeight;
          const rsiY30 = subplotTop + (1 - 30 / 100) * subplotPaneHeight;

          ctx.save();
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.moveTo(paddingLeft, rsiY70);
          ctx.lineTo(width - paddingRight, rsiY70);
          ctx.moveTo(paddingLeft, rsiY30);
          ctx.lineTo(width - paddingRight, rsiY30);
          ctx.stroke();
          ctx.restore();

          ctx.fillText('70', width - paddingRight + 6, rsiY70 + 3);
          ctx.fillText('30', width - paddingRight + 6, rsiY30 + 3);

          // Plot RSI curve
          ctx.strokeStyle = series.color;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          let rsiStarted = false;
          series.values.forEach((v, idx) => {
            if (v !== null && idx < candles.length) {
              const x = indexToX(idx);
              const y = subplotTop + (1 - v / 100) * subplotPaneHeight;
              if (!rsiStarted) {
                ctx.moveTo(x, y);
                rsiStarted = true;
              } else {
                ctx.lineTo(x, y);
              }
            }
          });
          ctx.stroke();
        } else if (series.name.startsWith('MACD')) {
          ctx.fillStyle = '#94a3b8';
          ctx.fillText('MACD (12, 26, 9)', paddingLeft, subplotTop - 4);

          // Scale for MACD
          let macdMin = -5;
          let macdMax = 5;
          series.values.forEach((v) => {
            if (v !== null) {
              if (v < macdMin) macdMin = v;
              if (v > macdMax) macdMax = v;
            }
          });
          const macdZeroY =
            subplotTop + (1 - (0 - macdMin) / (macdMax - macdMin)) * subplotPaneHeight;

          // Zero line
          ctx.strokeStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.moveTo(paddingLeft, macdZeroY);
          ctx.lineTo(width - paddingRight, macdZeroY);
          ctx.stroke();

          // Histogram
          if (series.tertiaryValues) {
            series.tertiaryValues.forEach((hist, idx) => {
              if (hist !== null && idx < candles.length) {
                const x = indexToX(idx);
                const hY =
                  subplotTop + (1 - (hist - macdMin) / (macdMax - macdMin)) * subplotPaneHeight;
                ctx.fillStyle = hist >= 0 ? '#10b981' : '#ef4444';
                ctx.fillRect(x - candleWidth / 2, Math.min(macdZeroY, hY), candleWidth, Math.abs(macdZeroY - hY));
              }
            });
          }

          // MACD Line
          ctx.strokeStyle = series.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          let mStarted = false;
          series.values.forEach((v, idx) => {
            if (v !== null && idx < candles.length) {
              const x = indexToX(idx);
              const y =
                subplotTop + (1 - (v - macdMin) / (macdMax - macdMin)) * subplotPaneHeight;
              if (!mStarted) {
                ctx.moveTo(x, y);
                mStarted = true;
              } else {
                ctx.lineTo(x, y);
              }
            }
          });
          ctx.stroke();

          // Signal Line
          if (series.secondaryValues) {
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            let sigStarted = false;
            series.secondaryValues.forEach((v, idx) => {
              if (v !== null && idx < candles.length) {
                const x = indexToX(idx);
                const y =
                  subplotTop + (1 - (v - macdMin) / (macdMax - macdMin)) * subplotPaneHeight;
                if (!sigStarted) {
                  ctx.moveTo(x, y);
                  sigStarted = true;
                } else {
                  ctx.lineTo(x, y);
                }
              }
            });
            ctx.stroke();
          }
        }
      });
    }

    // --- RENDER DATES ALONG X-AXIS ---
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    const dateStep = Math.max(1, Math.floor(candleCount / 6));
    for (let i = 0; i < candleCount; i += dateStep) {
      const x = indexToX(i);
      ctx.fillText(candles[i].date, x, height - 6);
    }

    // --- RENDER CROSSHAIR ---
    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < candles.length) {
      const x = indexToX(hoverIndex);
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(x, paddingTop);
      ctx.lineTo(x, height - paddingBottom);
      ctx.stroke();

      // Horizontal line
      if (crosshairY !== null && crosshairY >= paddingTop && crosshairY <= height - paddingBottom) {
        ctx.beginPath();
        ctx.moveTo(paddingLeft, crosshairY);
        ctx.lineTo(width - paddingRight, crosshairY);
        ctx.stroke();
      }
      ctx.restore();
    }
  }, [
    candles,
    chartType,
    overlaySeries,
    subplotSeries,
    supportResistanceLevels,
    currency,
    hoverIndex,
    crosshairY,
    hasSubplot,
  ]);

  // Mouse Move Interaction Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const paddingLeft = 10;
    const paddingRight = 65;
    const chartWidth = rect.width - paddingLeft - paddingRight;

    const candleSpacing = chartWidth / candles.length;
    const index = Math.floor((x - paddingLeft) / candleSpacing);

    if (index >= 0 && index < candles.length) {
      setHoverIndex(index);
      setCrosshairY(y);
    } else {
      setHoverIndex(null);
      setCrosshairY(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
    setCrosshairY(null);
  };

  // Inspect Active Candle (either hovered or the latest candle)
  const activeCandle =
    hoverIndex !== null && hoverIndex >= 0 && hoverIndex < candles.length
      ? candles[hoverIndex]
      : candles[candles.length - 1];

  const candleChange = activeCandle ? activeCandle.close - activeCandle.open : 0;
  const candleChangePct = activeCandle ? (candleChange / activeCandle.open) * 100 : 0;

  return (
    <div className="relative flex flex-col w-full" ref={containerRef}>
      {/* Live HUD Header */}
      {activeCandle && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-secondary/60 px-4 py-2 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-text-primary">
              Date: <span className="font-mono text-text-secondary">{activeCandle.date}</span>
            </span>
            <span>
              O: <span className="font-mono font-medium">{formatCurrency(activeCandle.open, currency)}</span>
            </span>
            <span>
              H: <span className="font-mono font-medium">{formatCurrency(activeCandle.high, currency)}</span>
            </span>
            <span>
              L: <span className="font-mono font-medium">{formatCurrency(activeCandle.low, currency)}</span>
            </span>
            <span>
              C: <span className="font-mono font-medium">{formatCurrency(activeCandle.close, currency)}</span>
            </span>
            <span
              className={`font-semibold ${
                candleChange >= 0 ? 'text-gain' : 'text-loss'
              }`}
            >
              {candleChange >= 0 ? '+' : ''}
              {formatCurrency(candleChange, currency)} ({candleChangePct.toFixed(2)}%)
            </span>
            <span>
              Vol: <span className="font-mono text-text-muted">{formatVolume(activeCandle.volume)}</span>
            </span>
          </div>

          {/* Active Overlay Values */}
          <div className="flex items-center gap-3">
            {overlaySeries.map((s) => {
              const val =
                hoverIndex !== null ? s.values[hoverIndex] : s.values[s.values.length - 1];
              if (val === null || val === undefined) return null;
              return (
                <span key={s.id} className="flex items-center gap-1 font-mono text-[11px]" style={{ color: s.color }}>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}: ${val.toFixed(2)}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Chart Canvas */}
      <div className="relative h-[520px] w-full bg-surface">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="cursor-crosshair h-full w-full"
        />
      </div>
    </div>
  );
}

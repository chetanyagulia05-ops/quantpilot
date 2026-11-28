"""
QuantPilot — Real-Data Python Quantitative Research & Risk Engine
(FastAPI + NumPy + Pandas + Yahoo Finance)

Provides:
1. Real historical OHLCV & live market quotes via yfinance with 5-min TTL cache
   (with deterministic fallback only if upstream network is unreachable).
2. Algorithmic strategy backtesting pipeline with 1-bar signal lag, slippage/fees,
   rolling Sharpe, rolling volatility, underwater drawdown, and trade ledger.
3. Institutional Portfolio Risk Indicator Modules:
   - Benchmark-relative Beta, Jensen's Alpha, Tracking Error, Information Ratio,
     R-squared, Up/Down Capture vs NIFTY50 / SPY
   - Higher-moment & tail risk: Sortino, Calmar, Omega, Skewness, Kurtosis,
     95% & 99% Historical + Parametric VaR & CVaR (Expected Shortfall)
   - Diversification Ratio & Effective Number of Bets (ENB)
   - Rolling 20D Sharpe, Rolling Volatility, Rolling Beta
   - Stress Testing & Scenario Shock Matrix
   - Mean-Variance Efficient Frontier (Max-Sharpe & Min-Variance weight targets)
   - 200-path Geometric Brownian Motion Monte Carlo forward simulation
"""

from __future__ import annotations

import math
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

import numpy as np
import pandas as pd
import yfinance as yf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="QuantPilot Quantitative Engine",
    version="2.0.0",
    description="Real-data NumPy/Pandas backtesting & institutional portfolio risk service.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


SUPPORTED_TICKERS: dict[str, dict[str, Any]] = {
    "RELIANCE": {
        "yf_symbol": "RELIANCE.NS",
        "name": "Reliance Industries Ltd.",
        "exchange": "NSE",
        "sector": "Energy & Digital",
        "fallback_price": 1382.60,
        "volatility": 0.016,
        "currency": "INR",
    },
    "TCS": {
        "yf_symbol": "TCS.NS",
        "name": "Tata Consultancy Services",
        "exchange": "NSE",
        "sector": "IT Services",
        "fallback_price": 2572.50,
        "volatility": 0.014,
        "currency": "INR",
    },
    "HDFCBANK": {
        "yf_symbol": "HDFCBANK.NS",
        "name": "HDFC Bank Ltd.",
        "exchange": "NSE",
        "sector": "Financial Services",
        "fallback_price": 857.25,
        "volatility": 0.015,
        "currency": "INR",
    },
    "INFY": {
        "yf_symbol": "INFY.NS",
        "name": "Infosys Limited",
        "exchange": "NSE",
        "sector": "IT Services",
        "fallback_price": 1151.30,
        "volatility": 0.017,
        "currency": "INR",
    },
    "TATAMOTORS": {
        "yf_symbol": "TMPV.NS",
        "name": "Tata Motors Passenger Vehicles",
        "exchange": "NSE",
        "sector": "Automotive",
        "fallback_price": 258.00,
        "volatility": 0.024,
        "currency": "INR",
    },
    "NIFTY50": {
        "yf_symbol": "^NSEI",
        "name": "NIFTY 50 Index",
        "exchange": "NSE Benchmark",
        "sector": "Indian Broad Market",
        "fallback_price": 25607.20,
        "volatility": 0.011,
        "currency": "INR",
    },
    "SENSEX": {
        "yf_symbol": "^BSESN",
        "name": "BSE SENSEX Index",
        "exchange": "BSE Benchmark",
        "sector": "Indian Broad Market",
        "fallback_price": 83339.26,
        "volatility": 0.011,
        "currency": "INR",
    },
    "BANKNIFTY": {
        "yf_symbol": "^NSEBANK",
        "name": "NIFTY Bank Index",
        "exchange": "NSE Sector",
        "sector": "Indian Banking",
        "fallback_price": 63040.90,
        "volatility": 0.014,
        "currency": "INR",
    },
    "SPX": {
        "yf_symbol": "^GSPC",
        "name": "S&P 500 Index",
        "exchange": "US Benchmark",
        "sector": "US Broad Market",
        "fallback_price": 7297.49,
        "volatility": 0.011,
        "currency": "USD",
    },
    "NDX": {
        "yf_symbol": "^NDX",
        "name": "NASDAQ 100 Index",
        "exchange": "US Tech Index",
        "sector": "US Technology",
        "fallback_price": 26726.39,
        "volatility": 0.015,
        "currency": "USD",
    },
    "NVDA": {
        "yf_symbol": "NVDA",
        "name": "NVIDIA Corporation",
        "exchange": "NASDAQ",
        "sector": "Semiconductors",
        "fallback_price": 150.49,
        "volatility": 0.028,
        "currency": "USD",
    },
    "AAPL": {
        "yf_symbol": "AAPL",
        "name": "Apple Inc.",
        "exchange": "NASDAQ",
        "sector": "Consumer Electronics",
        "fallback_price": 358.54,
        "volatility": 0.015,
        "currency": "USD",
    },
    "MSFT": {
        "yf_symbol": "MSFT",
        "name": "Microsoft Corporation",
        "exchange": "NASDAQ",
        "sector": "Enterprise Software",
        "fallback_price": 492.85,
        "volatility": 0.016,
        "currency": "USD",
    },
    "TSLA": {
        "yf_symbol": "TSLA",
        "name": "Tesla Inc.",
        "exchange": "NASDAQ",
        "sector": "Automotive / EV",
        "fallback_price": 400.00,
        "volatility": 0.034,
        "currency": "USD",
    },
    "SPY": {
        "yf_symbol": "SPY",
        "name": "SPDR S&P 500 ETF Trust",
        "exchange": "NYSE Arca",
        "sector": "US Broad Market",
        "fallback_price": 728.32,
        "volatility": 0.011,
        "currency": "USD",
    },
}

CACHE_TTL_SECONDS = 180.0
_OHLCV_CACHE: dict[str, tuple[float, pd.DataFrame, str]] = {}
_NEWS_CACHE: tuple[float, list[dict[str, Any]]] | None = None


def _seeded_random(seed: int) -> float:
    x = math.sin(seed) * 10000.0
    return x - math.floor(x)


def _format_hist_rows(hist: pd.DataFrame, date_fmt: str) -> pd.DataFrame:
    hist = hist.dropna(subset=["Open", "High", "Low", "Close"]).copy()
    hist.index = pd.to_datetime(hist.index)
    rows: list[dict[str, Any]] = []
    for idx, row in hist.iterrows():
        dt_utc = idx.to_pydatetime()
        if dt_utc.tzinfo is None:
            dt_utc = dt_utc.replace(tzinfo=timezone.utc)
        vol_raw = row.get("Volume", 0)
        vol_int = int(vol_raw) if not pd.isna(vol_raw) else 0
        rows.append(
            {
                "timestamp": int(dt_utc.timestamp()),
                "date": idx.strftime(date_fmt),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": vol_int,
            }
        )
    return pd.DataFrame(rows)


def fetch_intraday_ohlcv_df(symbol: str, timeframe: str, force_refresh: bool = False) -> tuple[pd.DataFrame, str]:
    """Fetch real intraday candles (5m for 1D, 15m for 1W, 1h for 1M) via yfinance."""
    sym = symbol.upper()
    meta = SUPPORTED_TICKERS.get(sym)
    if meta is None:
        raise HTTPException(status_code=404, detail=f"Unsupported ticker symbol: {symbol}")

    tf = timeframe.upper()
    cache_key = f"{sym}:{tf}"
    now = time.time()
    cached = _OHLCV_CACHE.get(cache_key)
    if not force_refresh and cached is not None and (now - cached[0]) < CACHE_TTL_SECONDS:
        return cached[1].copy(), cached[2]

    yf_sym = str(meta["yf_symbol"])
    period, interval, date_fmt = (
        ("5d", "5m", "%H:%M") if tf == "1D" else
        ("5d", "15m", "%m-%d %H:%M") if tf == "1W" else
        ("1mo", "1h", "%m-%d %H:%M")
    )

    try:
        hist = yf.Ticker(yf_sym).history(period=period, interval=interval, auto_adjust=True)
        if hist is not None and not hist.empty:
            hist.index = pd.to_datetime(hist.index)
            if tf == "1D":
                last_day = hist.index.date[-1]
                hist = hist[hist.index.date == last_day]
            df = _format_hist_rows(hist, date_fmt)
            if not df.empty:
                _OHLCV_CACHE[cache_key] = (now, df, "YAHOO_FINANCE_INTRADAY")
                return df.copy(), "YAHOO_FINANCE_INTRADAY"
    except Exception:
        pass

    if cached is not None:
        return cached[1].copy(), "YAHOO_FINANCE_CACHED"
    return fetch_real_ohlcv_df(sym, days=30 if tf == "1M" else 14, force_refresh=force_refresh)


def _generate_fallback_df(symbol: str, days: int = 500) -> pd.DataFrame:
    meta = SUPPORTED_TICKERS[symbol]
    base_price = float(meta["fallback_price"])
    vol = float(meta["volatility"])
    current_close = base_price * 0.78
    seed_base = sum(ord(c) for c in symbol) + 42
    anchor = datetime.now(timezone.utc).replace(hour=16, minute=0, second=0, microsecond=0)
    rows: list[dict[str, Any]] = []

    for i in range(int(days * 1.48), -1, -1):
        dt = anchor - timedelta(days=i)
        if dt.weekday() >= 5:
            continue
        seed = seed_base + i * 13
        r1 = _seeded_random(seed)
        r2 = _seeded_random(seed + 1)
        r3 = _seeded_random(seed + 2)
        r4 = _seeded_random(seed + 3)

        open_px = round(current_close, 2)
        current_close = max(1.0, open_px * (1.0 + 0.0006 + (r1 - 0.48) * 2.0 * vol))
        close_px = round(current_close, 2)
        high_px = round(max(open_px, close_px, max(open_px, close_px) * (1.0 + r2 * vol * 0.8)), 2)
        low_px = round(min(open_px, close_px, min(open_px, close_px) * (1.0 - r3 * vol * 0.8)), 2)
        base_vol = 12_000_000 if len(symbol) <= 4 else 2_500_000
        volume = int(round(base_vol * (2.2 if r4 > 0.85 else 0.6 + r4 * 0.8)))

        rows.append(
            {
                "timestamp": int(dt.timestamp()),
                "date": dt.strftime("%Y-%m-%d"),
                "open": open_px,
                "high": high_px,
                "low": low_px,
                "close": close_px,
                "volume": volume,
            }
        )

    df = pd.DataFrame(rows).tail(days).reset_index(drop=True)
    if not df.empty:
        scale = base_price / float(df["close"].iloc[-1])
        for col in ["open", "high", "low", "close"]:
            df[col] = (df[col] * scale).round(2)
        df.loc[df.index[-1], "close"] = round(base_price, 2)
    return df


def fetch_real_ohlcv_df(symbol: str, days: int = 260, force_refresh: bool = False) -> tuple[pd.DataFrame, str]:
    """Fetch real daily OHLCV DataFrame from Yahoo Finance with TTL caching."""
    sym = symbol.upper()
    meta = SUPPORTED_TICKERS.get(sym)
    if meta is None:
        raise HTTPException(status_code=404, detail=f"Unsupported ticker symbol: {symbol}")

    now = time.time()
    cached = _OHLCV_CACHE.get(sym)
    if not force_refresh and cached is not None and (now - cached[0]) < CACHE_TTL_SECONDS:
        df_full, src = cached[1], cached[2]
        return df_full.tail(days).reset_index(drop=True), src

    yf_sym = str(meta["yf_symbol"])
    try:
        hist = yf.Ticker(yf_sym).history(period="2y", interval="1d", auto_adjust=True)
        if hist is not None and not hist.empty and len(hist) >= 30:
            hist = hist.dropna(subset=["Open", "High", "Low", "Close"]).copy()
            hist.index = pd.to_datetime(hist.index)
            rows: list[dict[str, Any]] = []
            for idx, row in hist.iterrows():
                dt_utc = idx.to_pydatetime()
                if dt_utc.tzinfo is None:
                    dt_utc = dt_utc.replace(tzinfo=timezone.utc)
                vol_raw = row.get("Volume", 0)
                vol_int = int(vol_raw) if not pd.isna(vol_raw) else 0
                rows.append(
                    {
                        "timestamp": int(dt_utc.timestamp()),
                        "date": idx.strftime("%Y-%m-%d"),
                        "open": round(float(row["Open"]), 2),
                        "high": round(float(row["High"]), 2),
                        "low": round(float(row["Low"]), 2),
                        "close": round(float(row["Close"]), 2),
                        "volume": vol_int,
                    }
                )
            df_full = pd.DataFrame(rows)
            _OHLCV_CACHE[sym] = (now, df_full, "YAHOO_FINANCE_LIVE")
            return df_full.tail(days).reset_index(drop=True), "YAHOO_FINANCE_LIVE"
    except Exception:
        pass

    # If stale cache exists, keep using cached real data over synthetic fallback
    if cached is not None:
        return cached[1].tail(days).reset_index(drop=True), "YAHOO_FINANCE_CACHED"

    df_fb = _generate_fallback_df(sym, days=500)
    _OHLCV_CACHE[sym] = (now, df_fb, "SYNTHETIC_FALLBACK")
    return df_fb.tail(days).reset_index(drop=True), "SYNTHETIC_FALLBACK"


StrategyType = Literal[
    "SMA_CROSSOVER",
    "EMA_MOMENTUM",
    "RSI_MEAN_REVERSION",
    "BOLLINGER_BREAKOUT",
    "MACD_TREND",
]


class BacktestRequest(BaseModel):
    symbol: str = "RELIANCE"
    strategy: StrategyType = "EMA_MOMENTUM"
    lookback_days: int = Field(default=252, ge=60, le=500)
    initial_capital: float = Field(default=500_000.0, ge=1_000.0)
    position_size_pct: float = Field(default=95.0, ge=10.0, le=100.0)
    slippage_bps: float = Field(default=5.0, ge=0.0, le=100.0)
    commission_bps: float = Field(default=5.0, ge=0.0, le=100.0)
    risk_free_rate: float = Field(default=0.065, ge=0.0, le=0.2)
    params: dict[str, float] = Field(default_factory=dict)


class HoldingInput(BaseModel):
    symbol: str
    quantity: float
    current_price: float
    avg_cost: float
    sector: str = "Equities"


class PortfolioRiskRequest(BaseModel):
    user_id: str
    cash_balance: float = 0.0
    holdings: list[HoldingInput]
    currency: str = "INR"
    risk_free_rate: float = 0.065
    horizon_days: int = Field(default=60, ge=10, le=252)
    num_simulations: int = Field(default=200, ge=50, le=500)


def _compute_rsi(close: pd.Series, period: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0.0)
    loss = (-delta).clip(lower=0.0)
    avg_gain = gain.ewm(alpha=1.0 / period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1.0 / period, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0.0, np.nan)
    return (100.0 - (100.0 / (1.0 + rs))).fillna(50.0)


def _generate_signals(df: pd.DataFrame, strategy: StrategyType, params: dict[str, float]) -> pd.Series:
    close = df["close"]
    sig = pd.Series(0, index=df.index, dtype=int)

    if strategy == "SMA_CROSSOVER":
        fast = int(params.get("fast_period", 10))
        slow = int(params.get("slow_period", 30))
        sig = (close.rolling(fast).mean() > close.rolling(slow).mean()).astype(int)

    elif strategy == "EMA_MOMENTUM":
        fast = int(params.get("fast_period", 12))
        slow = int(params.get("slow_period", 26))
        sig = (close.ewm(span=fast, adjust=False).mean() > close.ewm(span=slow, adjust=False).mean()).astype(int)

    elif strategy == "RSI_MEAN_REVERSION":
        period = int(params.get("rsi_period", 14))
        oversold = float(params.get("oversold", 35.0))
        overbought = float(params.get("overbought", 68.0))
        rsi = _compute_rsi(close, period)
        pos = 0
        out: list[int] = []
        for v in rsi:
            if v <= oversold:
                pos = 1
            elif v >= overbought:
                pos = 0
            out.append(pos)
        sig = pd.Series(out, index=df.index, dtype=int)

    elif strategy == "BOLLINGER_BREAKOUT":
        period = int(params.get("bb_period", 20))
        num_std = float(params.get("bb_std", 2.0))
        mid = close.rolling(period).mean()
        std = close.rolling(period).std(ddof=0)
        upper = mid + num_std * std
        lower = mid - num_std * std
        pos = 0
        out = []
        for c, lo, hi, m in zip(close, lower, upper, mid):
            if np.isnan(lo) or np.isnan(hi):
                out.append(0)
                continue
            if c <= lo:
                pos = 1
            elif c >= hi or (pos == 1 and c >= m * 1.015):
                pos = 0
            out.append(pos)
        sig = pd.Series(out, index=df.index, dtype=int)

    elif strategy == "MACD_TREND":
        fast = int(params.get("fast_period", 12))
        slow = int(params.get("slow_period", 26))
        signal_p = int(params.get("signal_period", 9))
        macd = close.ewm(span=fast, adjust=False).mean() - close.ewm(span=slow, adjust=False).mean()
        signal_line = macd.ewm(span=signal_p, adjust=False).mean()
        sig = (macd > signal_line).astype(int)

    return sig


def _risk_metrics_from_returns(
    returns: pd.Series,
    equity: pd.Series,
    risk_free_rate: float = 0.065,
    benchmark_returns: pd.Series | None = None,
) -> dict[str, Any]:
    n = len(returns)
    if n < 5:
        return {
            "total_return_pct": 0.0,
            "cagr_pct": 0.0,
            "annualized_volatility_pct": 0.0,
            "sharpe_ratio": 0.0,
            "sortino_ratio": 0.0,
            "calmar_ratio": 0.0,
            "omega_ratio": 1.0,
            "max_drawdown_pct": 0.0,
            "max_drawdown_duration_days": 0,
            "var_95_pct": 0.0,
            "cvar_95_pct": 0.0,
            "var_99_pct": 0.0,
            "cvar_99_pct": 0.0,
            "parametric_var_95_pct": 0.0,
            "skewness": 0.0,
            "excess_kurtosis": 0.0,
            "beta": 1.0,
            "jensens_alpha_pct": 0.0,
            "tracking_error_pct": 0.0,
            "information_ratio": 0.0,
            "r_squared": 0.0,
            "up_capture_pct": 100.0,
            "down_capture_pct": 100.0,
        }

    total_return = (float(equity.iloc[-1]) / float(equity.iloc[0])) - 1.0
    years = max(n / 252.0, 1.0 / 252.0)
    cagr = ((1.0 + total_return) ** (1.0 / years)) - 1.0 if total_return > -0.999 else -1.0

    mu_daily = float(returns.mean())
    sigma_daily = float(returns.std(ddof=1))
    ann_vol = sigma_daily * math.sqrt(252.0)
    daily_rf = risk_free_rate / 252.0
    excess = returns - daily_rf
    ann_excess_mean = float(excess.mean() * 252.0)
    sharpe = (ann_excess_mean / ann_vol) if ann_vol > 1e-9 else 0.0

    downside = excess[excess < 0.0]
    downside_std = float(downside.std(ddof=1) * math.sqrt(252.0)) if len(downside) > 1 else ann_vol
    sortino = (ann_excess_mean / downside_std) if downside_std > 1e-9 else 0.0

    gains_above = excess[excess > 0.0].sum()
    losses_below = abs(excess[excess < 0.0].sum())
    omega = float(gains_above / losses_below) if losses_below > 1e-9 else 2.0

    running_peak = equity.cummax()
    drawdown = (equity - running_peak) / running_peak
    max_dd = float(drawdown.min())

    max_dur = 0
    cur_dur = 0
    for flag in (drawdown < 0.0):
        if flag:
            cur_dur += 1
            max_dur = max(max_dur, cur_dur)
        else:
            cur_dur = 0

    calmar = (cagr / abs(max_dd)) if abs(max_dd) > 1e-6 else 0.0

    ret_np = returns.to_numpy(dtype=float)
    var_95 = float(np.percentile(ret_np, 5))
    tail_95 = ret_np[ret_np <= var_95]
    cvar_95 = float(tail_95.mean()) if len(tail_95) > 0 else var_95

    var_99 = float(np.percentile(ret_np, 1))
    tail_99 = ret_np[ret_np <= var_99]
    cvar_99 = float(tail_99.mean()) if len(tail_99) > 0 else var_99

    parametric_var_95 = mu_daily - 1.64485 * sigma_daily
    skewness = float(returns.skew()) if n > 3 else 0.0
    excess_kurtosis = float(returns.kurt()) if n > 4 else 0.0

    # Benchmark-relative indicators
    beta = 1.0
    jensens_alpha = 0.0
    tracking_error = 0.0
    info_ratio = 0.0
    r_squared = 0.0
    up_capture = 100.0
    down_capture = 100.0

    if benchmark_returns is not None and len(benchmark_returns) == len(returns):
        b = benchmark_returns.astype(float)
        b_var = float(b.var(ddof=1))
        if b_var > 1e-12:
            cov_pb = float(np.cov(returns.to_numpy(), b.to_numpy(), ddof=1)[0, 1])
            beta = cov_pb / b_var
            corr = float(returns.corr(b))
            r_squared = 0.0 if math.isnan(corr) else corr ** 2

            ann_p = float(returns.mean() * 252.0)
            ann_b = float(b.mean() * 252.0)
            jensens_alpha = (ann_p - risk_free_rate) - beta * (ann_b - risk_free_rate)

            active = returns - b
            tracking_error = float(active.std(ddof=1) * math.sqrt(252.0))
            info_ratio = (float(active.mean() * 252.0) / tracking_error) if tracking_error > 1e-9 else 0.0

            up_mask = b > 0
            down_mask = b < 0
            if up_mask.sum() > 2 and abs(float(b[up_mask].mean())) > 1e-9:
                up_capture = (float(returns[up_mask].mean()) / float(b[up_mask].mean())) * 100.0
            if down_mask.sum() > 2 and abs(float(b[down_mask].mean())) > 1e-9:
                down_capture = (float(returns[down_mask].mean()) / float(b[down_mask].mean())) * 100.0

    return {
        "total_return_pct": round(total_return * 100.0, 2),
        "cagr_pct": round(cagr * 100.0, 2),
        "annualized_volatility_pct": round(ann_vol * 100.0, 2),
        "sharpe_ratio": round(sharpe, 2),
        "sortino_ratio": round(sortino, 2),
        "calmar_ratio": round(calmar, 2),
        "omega_ratio": round(omega, 2),
        "max_drawdown_pct": round(max_dd * 100.0, 2),
        "max_drawdown_duration_days": int(max_dur),
        "var_95_pct": round(var_95 * 100.0, 2),
        "cvar_95_pct": round(cvar_95 * 100.0, 2),
        "var_99_pct": round(var_99 * 100.0, 2),
        "cvar_99_pct": round(cvar_99 * 100.0, 2),
        "parametric_var_95_pct": round(parametric_var_95 * 100.0, 2),
        "skewness": round(0.0 if math.isnan(skewness) else skewness, 2),
        "excess_kurtosis": round(0.0 if math.isnan(excess_kurtosis) else excess_kurtosis, 2),
        "beta": round(beta, 2),
        "jensens_alpha_pct": round(jensens_alpha * 100.0, 2),
        "tracking_error_pct": round(tracking_error * 100.0, 2),
        "information_ratio": round(info_ratio, 2),
        "r_squared": round(r_squared, 2),
        "up_capture_pct": round(up_capture, 1),
        "down_capture_pct": round(down_capture, 1),
    }


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "engine": "python-numpy-pandas-yfinance",
        "numpy_version": np.__version__,
        "pandas_version": pd.__version__,
        "yfinance_version": yf.__version__,
        "supported_tickers": len(SUPPORTED_TICKERS),
    }


@app.get("/api/quant/quotes")
def get_live_quotes(refresh: bool = False) -> dict[str, Any]:
    quotes: list[dict[str, Any]] = []
    sources: set[str] = set()
    now_iso = datetime.now(timezone.utc).isoformat()

    for sym, meta in SUPPORTED_TICKERS.items():
        df, src = fetch_real_ohlcv_df(sym, days=30, force_refresh=refresh)
        sources.add(src)
        last_row = df.iloc[-1]
        prev_row = df.iloc[-2] if len(df) > 1 else last_row
        last_px = round(float(last_row["close"]), 2)
        prev_px = round(float(prev_row["close"]), 2)
        chg = round(last_px - prev_px, 2)
        chg_pct = round((chg / prev_px) * 100.0, 2) if prev_px > 0 else 0.0
        half_spread = max(0.05, round(last_px * 0.0003, 2))

        rets = df["close"].pct_change().dropna()
        ann_vol = round(float(rets.std(ddof=1) * math.sqrt(252.0)), 4) if len(rets) > 2 else meta["volatility"]

        quotes.append(
            {
                "symbol": sym,
                "yf_symbol": meta["yf_symbol"],
                "name": meta["name"],
                "exchange": meta["exchange"],
                "sector": meta["sector"],
                "currency": meta["currency"],
                "basePrice": last_px,
                "lastPrice": last_px,
                "bid": round(last_px - half_spread, 2),
                "ask": round(last_px + half_spread, 2),
                "prevClose": prev_px,
                "change": chg,
                "changePct": chg_pct,
                "volatility": ann_vol,
                "volume": int(last_row["volume"]),
                "lastTradeDate": str(last_row["date"]),
                "dataSource": src,
                "updatedAt": now_iso,
            }
        )

    overall_source = (
        "YAHOO_FINANCE_LIVE"
        if "YAHOO_FINANCE_LIVE" in sources
        else "YAHOO_FINANCE_CACHED"
        if "YAHOO_FINANCE_CACHED" in sources
        else "SYNTHETIC_FALLBACK"
    )
    return {
        "data_source": overall_source,
        "quotes": quotes,
        "timestamp": now_iso,
    }


@app.get("/api/quant/ohlcv/{symbol}")
def get_ohlcv(symbol: str, days: int = 260, timeframe: str = "3M", refresh: bool = False) -> dict[str, Any]:
    sym = symbol.upper()
    tf = timeframe.upper()
    if tf in {"1D", "1W", "1M"}:
        df, src = fetch_intraday_ohlcv_df(sym, tf, force_refresh=refresh)
    else:
        slice_days = 66 if tf == "3M" else 252 if tf == "1Y" else max(30, min(days, 500))
        df, src = fetch_real_ohlcv_df(sym, days=slice_days, force_refresh=refresh)
    meta = SUPPORTED_TICKERS[sym]
    return {
        "symbol": sym,
        "yf_symbol": meta["yf_symbol"],
        "timeframe": tf,
        "data_source": src,
        "meta": meta,
        "candles": df.to_dict(orient="records"),
    }


@app.get("/api/quant/market-overview")
def get_market_overview(refresh: bool = False) -> dict[str, Any]:
    """Live indices (NIFTY50, SENSEX, BANKNIFTY, S&P 500, NASDAQ 100) + real sector performance."""
    index_specs = [
        ("NIFTY50", "NIFTY 50", "NSE Benchmark", "India"),
        ("SENSEX", "SENSEX", "BSE Benchmark", "India"),
        ("BANKNIFTY", "BANK NIFTY", "NSE Banking", "India"),
        ("SPX", "S&P 500", "US Broad Market", "US"),
        ("NDX", "NASDAQ 100", "US Tech Index", "US"),
    ]
    indices: list[dict[str, Any]] = []
    sources: set[str] = set()
    latest_date = ""

    for sym, label, desc, region in index_specs:
        df, src = fetch_real_ohlcv_df(sym, days=10, force_refresh=refresh)
        sources.add(src)
        last_px = round(float(df["close"].iloc[-1]), 2)
        prev_px = round(float(df["close"].iloc[-2]), 2) if len(df) > 1 else last_px
        chg = round(last_px - prev_px, 2)
        chg_pct = round((chg / prev_px) * 100.0, 2) if prev_px > 0 else 0.0
        latest_date = str(df["date"].iloc[-1])
        indices.append(
            {
                "chartSymbol": sym,
                "symbol": label,
                "name": desc,
                "value": last_px,
                "change": chg,
                "change_pct": chg_pct,
                "region": region,
                "lastTradeDate": latest_date,
            }
        )

    sector_proxies = [
        ("NSE Energy & Digital", "RELIANCE"),
        ("NSE IT Services", "TCS"),
        ("NSE Banking", "BANKNIFTY"),
        ("NSE Auto", "TATAMOTORS"),
        ("US Semiconductors", "NVDA"),
        ("US Enterprise Tech", "MSFT"),
        ("US Broad Market", "SPY"),
    ]
    sectors: list[dict[str, Any]] = []
    for sec_name, proxy_sym in sector_proxies:
        df, _ = fetch_real_ohlcv_df(proxy_sym, days=10, force_refresh=False)
        last_px = float(df["close"].iloc[-1])
        prev_px = float(df["close"].iloc[-2]) if len(df) > 1 else last_px
        chg_pct = round(((last_px - prev_px) / prev_px) * 100.0, 2) if prev_px > 0 else 0.0
        sectors.append({"name": sec_name, "change_pct": chg_pct, "symbol": proxy_sym})

    return {
        "data_source": "YAHOO_FINANCE_LIVE" if "YAHOO_FINANCE_LIVE" in sources else "YAHOO_FINANCE_CACHED",
        "lastTradeDate": latest_date,
        "indices": indices,
        "sectors": sectors,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/quant/news")
def get_live_news(refresh: bool = False) -> dict[str, Any]:
    """Fetch live financial headlines from Yahoo Finance across Indian & US benchmarks."""
    global _NEWS_CACHE
    now = time.time()
    if not refresh and _NEWS_CACHE is not None and (now - _NEWS_CACHE[0]) < CACHE_TTL_SECONDS:
        return {"data_source": "YAHOO_FINANCE_LIVE", "articles": _NEWS_CACHE[1]}

    feed_specs = [
        ("^NSEI", ["NIFTY50", "RELIANCE"], "market"),
        ("RELIANCE.NS", ["RELIANCE"], "company"),
        ("NVDA", ["NVDA", "MSFT"], "company"),
        ("SPY", ["SPY", "AAPL"], "economy"),
    ]
    seen_titles: set[str] = set()
    articles: list[dict[str, Any]] = []

    pos_words = {"surge", "rally", "gain", "beat", "record", "jump", "rise", "up", "growth", "bull"}
    neg_words = {"drop", "fall", "slide", "loss", "cut", "risk", "crash", "down", "slump", "warn"}

    for yf_sym, rel_syms, default_cat in feed_specs:
        try:
            items = yf.Ticker(yf_sym).news or []
            for item in items[:5]:
                content = item.get("content") or item
                title = str(content.get("title") or "").strip()
                if not title or title in seen_titles:
                    continue
                seen_titles.add(title)
                summary = str(content.get("summary") or content.get("description") or title).strip()
                pub = str((content.get("provider") or {}).get("displayName") or "Yahoo Finance")
                pub_date = str(content.get("pubDate") or datetime.now(timezone.utc).isoformat())
                url = str(
                    ((content.get("canonicalUrl") or {}).get("url"))
                    or ((content.get("clickThroughUrl") or {}).get("url"))
                    or "#"
                )
                lower = f"{title} {summary}".lower()
                pos_hits = sum(1 for w in pos_words if w in lower)
                neg_hits = sum(1 for w in neg_words if w in lower)
                sentiment = "positive" if pos_hits > neg_hits else "negative" if neg_hits > pos_hits else "neutral"

                cat = default_cat
                if any(w in lower for w in ("fed", "rbi", "inflation", "rate", "gdp", "tariff", "treasury")):
                    cat = "economy"
                elif any(w in lower for w in ("china", "war", "sanction", "geopolit", "europe", "election")):
                    cat = "geopolitical"

                articles.append(
                    {
                        "id": str(item.get("id") or f"yf-{len(articles)}"),
                        "title": title,
                        "summary": summary[:320] + ("..." if len(summary) > 320 else ""),
                        "source": pub,
                        "published_at": pub_date,
                        "url": url,
                        "category": cat,
                        "sentiment": sentiment,
                        "related_symbols": rel_syms,
                    }
                )
        except Exception:
            continue

    articles.sort(key=lambda a: a["published_at"], reverse=True)
    _NEWS_CACHE = (now, articles[:16])
    return {"data_source": "YAHOO_FINANCE_LIVE", "articles": _NEWS_CACHE[1]}


@app.post("/api/quant/backtest")
def run_backtest(req: BacktestRequest) -> dict[str, Any]:
    sym = req.symbol.upper()
    if sym not in SUPPORTED_TICKERS:
        raise HTTPException(status_code=404, detail=f"Unsupported symbol: {req.symbol}")

    meta = SUPPORTED_TICKERS[sym]
    df, src = fetch_real_ohlcv_df(sym, days=req.lookback_days)
    signals = _generate_signals(df, req.strategy, req.params)
    target_pos = signals.shift(1).fillna(0).astype(int)

    cash = float(req.initial_capital)
    shares = 0.0
    entry_price = 0.0
    entry_date = ""
    entry_cost_total = 0.0
    total_fees_paid = 0.0
    total_slippage_paid = 0.0

    slip_frac = req.slippage_bps / 10_000.0
    comm_frac = req.commission_bps / 10_000.0
    size_frac = req.position_size_pct / 100.0

    equity_curve: list[float] = []
    bench_shares = (req.initial_capital * size_frac) / float(df["close"].iloc[0])
    bench_cash = req.initial_capital * (1.0 - size_frac)
    benchmark_curve: list[float] = []
    trades: list[dict[str, Any]] = []
    bars_in_market = 0

    for idx, row in df.iterrows():
        px = float(row["close"])
        dt = str(row["date"])
        desired = int(target_pos.iloc[idx])

        if desired == 1 and shares == 0.0:
            exec_px = px * (1.0 + slip_frac)
            alloc_budget = cash * size_frac
            gross_shares = alloc_budget / (exec_px * (1.0 + comm_frac))
            qty = math.floor(gross_shares * 100.0) / 100.0
            if qty > 0.0:
                notional = qty * exec_px
                fee = notional * comm_frac
                slip_cost = qty * (exec_px - px)
                cash -= notional + fee
                shares = qty
                entry_price = exec_px
                entry_date = dt
                entry_cost_total = notional + fee
                total_fees_paid += fee
                total_slippage_paid += slip_cost

        elif desired == 0 and shares > 0.0:
            exec_px = px * (1.0 - slip_frac)
            notional = shares * exec_px
            fee = notional * comm_frac
            slip_cost = shares * (px - exec_px)
            proceeds = notional - fee
            pnl = proceeds - entry_cost_total
            pnl_pct = (pnl / entry_cost_total) * 100.0 if entry_cost_total > 0 else 0.0
            trades.append(
                {
                    "entry_date": entry_date,
                    "exit_date": dt,
                    "side": "LONG",
                    "quantity": round(shares, 2),
                    "entry_price": round(entry_price, 2),
                    "exit_price": round(exec_px, 2),
                    "fees": round(fee + (entry_cost_total - shares * entry_price), 2),
                    "pnl": round(pnl, 2),
                    "pnl_pct": round(pnl_pct, 2),
                }
            )
            cash += proceeds
            shares = 0.0
            total_fees_paid += fee
            total_slippage_paid += slip_cost

        if shares > 0.0:
            bars_in_market += 1

        equity_curve.append(round(cash + shares * px, 2))
        benchmark_curve.append(round(bench_cash + bench_shares * px, 2))

    eq_series = pd.Series(equity_curve, dtype=float)
    bench_series = pd.Series(benchmark_curve, dtype=float)
    returns = eq_series.pct_change().fillna(0.0)
    bench_returns = bench_series.pct_change().fillna(0.0)

    daily_rf = req.risk_free_rate / 252.0
    roll_mean = (returns - daily_rf).rolling(20).mean() * 252.0
    roll_vol = returns.rolling(20).std(ddof=1) * np.sqrt(252.0)
    roll_sharpe = (roll_mean / roll_vol.replace(0.0, np.nan)).fillna(0.0).clip(-5.0, 8.0)

    running_peak = eq_series.cummax()
    drawdown_pct = ((eq_series - running_peak) / running_peak) * 100.0
    bench_peak = bench_series.cummax()
    bench_dd_pct = ((bench_series - bench_peak) / bench_peak) * 100.0

    metrics = _risk_metrics_from_returns(returns, eq_series, req.risk_free_rate, bench_returns)
    bench_metrics = _risk_metrics_from_returns(bench_returns, bench_series, req.risk_free_rate, bench_returns)

    wins = [t for t in trades if t["pnl"] > 0]
    losses = [t for t in trades if t["pnl"] <= 0]
    win_rate = (len(wins) / len(trades) * 100.0) if trades else 0.0
    gross_profit = sum(t["pnl"] for t in wins)
    gross_loss = abs(sum(t["pnl"] for t in losses))
    profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else (2.5 if gross_profit > 0 else 0.0)

    timeseries = []
    for idx in range(len(df)):
        timeseries.append(
            {
                "date": str(df["date"].iloc[idx]),
                "price": float(df["close"].iloc[idx]),
                "equity": float(eq_series.iloc[idx]),
                "benchmark": float(bench_series.iloc[idx]),
                "drawdown_pct": round(float(drawdown_pct.iloc[idx]), 2),
                "benchmark_drawdown_pct": round(float(bench_dd_pct.iloc[idx]), 2),
                "rolling_sharpe": round(float(roll_sharpe.iloc[idx]), 2),
                "rolling_volatility_pct": round(
                    float((roll_vol.iloc[idx] if not np.isnan(roll_vol.iloc[idx]) else 0.0) * 100.0), 2
                ),
                "signal": int(target_pos.iloc[idx]),
            }
        )

    return {
        "symbol": sym,
        "yf_symbol": meta["yf_symbol"],
        "data_source": src,
        "currency": meta["currency"],
        "strategy": req.strategy,
        "lookback_days": len(df),
        "date_range": f"{df['date'].iloc[0]} → {df['date'].iloc[-1]}",
        "initial_capital": req.initial_capital,
        "final_equity": float(eq_series.iloc[-1]),
        "benchmark_final_equity": float(bench_series.iloc[-1]),
        "alpha_pct": round(metrics["total_return_pct"] - bench_metrics["total_return_pct"], 2),
        "exposure_pct": round((bars_in_market / len(df)) * 100.0, 1),
        "total_trades": len(trades),
        "win_rate_pct": round(win_rate, 1),
        "profit_factor": round(profit_factor, 2),
        "total_fees_paid": round(total_fees_paid, 2),
        "total_slippage_paid": round(total_slippage_paid, 2),
        "metrics": metrics,
        "benchmark_metrics": bench_metrics,
        "timeseries": timeseries,
        "trades": list(reversed(trades)),
    }


@app.post("/api/quant/portfolio-risk")
def analyze_portfolio_risk(req: PortfolioRiskRequest) -> dict[str, Any]:
    if not req.holdings:
        return {
            "user_id": req.user_id,
            "benchmark_symbol": "NIFTY50" if req.currency == "INR" else "SPY",
            "data_source": "YAHOO_FINANCE_LIVE",
            "total_equity": round(req.cash_balance, 2),
            "invested_value": 0.0,
            "cash_weight_pct": 100.0,
            "diversification_ratio": 1.0,
            "effective_num_bets": 1.0,
            "metrics": _risk_metrics_from_returns(pd.Series([0.0]), pd.Series([max(req.cash_balance, 1.0)])),
            "rolling_series": [],
            "correlation_matrix": {"symbols": [], "matrix": []},
            "risk_contributions": [],
            "stress_scenarios": [],
            "efficient_frontier": {"cloud": [], "current": None, "max_sharpe": None, "min_variance": None},
            "monte_carlo": [],
        }

    price_frames: dict[str, pd.Series] = {}
    weights_raw: dict[str, float] = {}
    total_holdings_val = 0.0
    sources: set[str] = set()

    for h in req.holdings:
        sym = h.symbol.upper()
        if sym not in SUPPORTED_TICKERS:
            continue
        mv = max(0.0, float(h.quantity) * float(h.current_price))
        if mv <= 0:
            continue
        df, src = fetch_real_ohlcv_df(sym, days=220)
        sources.add(src)
        price_frames[sym] = df.set_index("date")["close"]
        weights_raw[sym] = weights_raw.get(sym, 0.0) + mv
        total_holdings_val += mv

    total_equity = total_holdings_val + max(0.0, req.cash_balance)
    if total_equity <= 0 or not price_frames:
        raise HTTPException(status_code=400, detail="Portfolio has no valid holdings for risk modeling.")

    bench_sym = "NIFTY50" if req.currency.upper() == "INR" else "SPY"
    bench_df, bench_src = fetch_real_ohlcv_df(bench_sym, days=220)
    sources.add(bench_src)
    bench_series_raw = bench_df.set_index("date")["close"]

    prices_df = pd.DataFrame(price_frames).join(bench_series_raw.rename("__BENCH__"), how="inner").dropna()
    returns_all = prices_df.pct_change().dropna()
    bench_returns = returns_all["__BENCH__"]
    returns_df = returns_all.drop(columns=["__BENCH__"])
    symbols = list(returns_df.columns)

    # Invested weights vs total-equity weights (including cash drag)
    equity_weights = np.array([weights_raw[s] / total_equity for s in symbols], dtype=float)
    invested_weights = np.array([weights_raw[s] / total_holdings_val for s in symbols], dtype=float)

    port_returns = pd.Series(returns_df.to_numpy() @ equity_weights, index=returns_df.index)
    # Reconstruct backward historical portfolio trajectory anchored to current total_equity
    cum_factors = (1.0 + port_returns).cumprod()
    start_equity = total_equity / float(cum_factors.iloc[-1])
    port_equity_hist = start_equity * cum_factors
    port_equity = pd.concat([pd.Series([start_equity], index=["start"]), port_equity_hist])

    bench_cum = (1.0 + bench_returns).cumprod()
    bench_start = total_equity / float(bench_cum.iloc[-1])
    bench_equity_hist = bench_start * bench_cum

    metrics = _risk_metrics_from_returns(port_returns, port_equity, req.risk_free_rate, bench_returns)

    # Rolling 20D Sharpe, Volatility & Beta
    daily_rf = req.risk_free_rate / 252.0
    roll_mean = (port_returns - daily_rf).rolling(20).mean() * 252.0
    roll_vol = port_returns.rolling(20).std(ddof=1) * np.sqrt(252.0)
    roll_sharpe = (roll_mean / roll_vol.replace(0.0, np.nan)).fillna(0.0).clip(-4.0, 6.0)

    roll_cov = port_returns.rolling(20).cov(bench_returns)
    roll_bvar = bench_returns.rolling(20).var(ddof=1)
    roll_beta = (roll_cov / roll_bvar.replace(0.0, np.nan)).fillna(metrics["beta"]).clip(-2.0, 3.5)

    peak = port_equity_hist.cummax()
    dd_series = ((port_equity_hist - peak) / peak) * 100.0
    b_peak = bench_equity_hist.cummax()
    b_dd_series = ((bench_equity_hist - b_peak) / b_peak) * 100.0

    rolling_series = []
    for dt in returns_df.index:
        rv = roll_vol.loc[dt]
        rs = roll_sharpe.loc[dt]
        rb = roll_beta.loc[dt]
        rolling_series.append(
            {
                "date": str(dt),
                "rolling_sharpe": round(float(0.0 if np.isnan(rs) else rs), 2),
                "rolling_volatility_pct": round(float(0.0 if np.isnan(rv) else rv * 100.0), 2),
                "rolling_beta": round(float(0.0 if np.isnan(rb) else rb), 2),
                "drawdown_pct": round(float(dd_series.loc[dt]), 2),
                "benchmark_drawdown_pct": round(float(b_dd_series.loc[dt]), 2),
                "equity": round(float(port_equity_hist.loc[dt]), 2),
                "benchmark": round(float(bench_equity_hist.loc[dt]), 2),
            }
        )

    # Correlation Matrix & Covariance Risk Decomposition
    corr_df = returns_df.corr().round(2).fillna(0.0)
    corr_matrix = [[float(corr_df.loc[r, c]) for c in symbols] for r in symbols]

    cov_ann = returns_df.cov().to_numpy() * 252.0
    port_var = float(equity_weights.T @ cov_ann @ equity_weights)
    port_vol = math.sqrt(max(port_var, 1e-12))
    standalone_vols = np.sqrt(np.maximum(np.diag(cov_ann), 0.0))

    weighted_avg_vol = float(np.sum(equity_weights * standalone_vols))
    diversification_ratio = round(weighted_avg_vol / port_vol, 2) if port_vol > 1e-9 else 1.0

    marginal_contrib = (cov_ann @ equity_weights) / port_vol
    risk_contrib_frac = (equity_weights * marginal_contrib) / port_vol
    eff_bets = round(1.0 / float(np.sum(np.square(risk_contrib_frac))), 2) if np.sum(np.square(risk_contrib_frac)) > 1e-9 else 1.0

    # Per-asset beta & marginal VaR
    b_var_full = max(float(bench_returns.var(ddof=1)), 1e-12)
    risk_contributions = []
    for i, sym in enumerate(symbols):
        sym_ret = returns_df[sym]
        sym_beta = float(np.cov(sym_ret.to_numpy(), bench_returns.to_numpy(), ddof=1)[0, 1]) / b_var_full
        risk_contributions.append(
            {
                "symbol": sym,
                "weight_pct": round(float(equity_weights[i] * 100.0), 1),
                "risk_contribution_pct": round(float(risk_contrib_frac[i] * 100.0), 1),
                "standalone_vol_pct": round(float(standalone_vols[i] * 100.0), 2),
                "beta": round(sym_beta, 2),
            }
        )

    # Stress Testing & Scenario Shock Matrix
    port_beta = metrics["beta"]
    stress_scenarios = [
        {
            "scenario": "Broad Market Crash (-20% Benchmark)",
            "shock_assumption": f"Beta ({port_beta:.2f}) x -20% market shock",
            "estimated_impact_pct": round(-20.0 * port_beta, 2),
            "estimated_pnl": round(total_equity * (-0.20 * port_beta), 2),
        },
        {
            "scenario": "Growth / Rate Shock (-10% Market)",
            "shock_assumption": f"Beta ({port_beta:.2f}) x -10% drawdown",
            "estimated_impact_pct": round(-10.0 * port_beta, 2),
            "estimated_pnl": round(total_equity * (-0.10 * port_beta), 2),
        },
        {
            "scenario": "99% Tail Event (1-Day CVaR)",
            "shock_assumption": "Empirical 1% worst-tail expected shortfall",
            "estimated_impact_pct": metrics["cvar_99_pct"],
            "estimated_pnl": round(total_equity * (metrics["cvar_99_pct"] / 100.0), 2),
        },
        {
            "scenario": "Volatility Regime Spike (2x Vol)",
            "shock_assumption": f"10-day 95% VaR under 2x vol ({metrics['annualized_volatility_pct'] * 2:.1f}%)",
            "estimated_impact_pct": round(-2.0 * abs(metrics["var_95_pct"]) * math.sqrt(10.0), 2),
            "estimated_pnl": round(total_equity * (-2.0 * abs(metrics["var_95_pct"]) / 100.0 * math.sqrt(10.0)), 2),
        },
    ]

    # Mean-Variance Efficient Frontier Simulation across held risky assets
    mean_ann_rets = returns_df.mean().to_numpy() * 252.0
    rng_ef = np.random.default_rng(42)
    n_assets = len(symbols)
    cloud: list[dict[str, Any]] = []
    best_sharpe = -999.0
    min_vol = 999.0
    max_sharpe_pt: dict[str, Any] | None = None
    min_var_pt: dict[str, Any] | None = None

    if n_assets >= 2:
        sample_weights = rng_ef.dirichlet(np.ones(n_assets), size=280)
        for w in sample_weights:
            r_ann = float(w @ mean_ann_rets)
            v_ann = math.sqrt(max(float(w.T @ cov_ann @ w), 1e-12))
            sr = (r_ann - req.risk_free_rate) / v_ann
            pt = {
                "vol_pct": round(v_ann * 100.0, 2),
                "ret_pct": round(r_ann * 100.0, 2),
                "sharpe": round(sr, 2),
                "weights": {symbols[i]: round(float(w[i] * 100.0), 1) for i in range(n_assets)},
            }
            cloud.append({"vol_pct": pt["vol_pct"], "ret_pct": pt["ret_pct"], "sharpe": pt["sharpe"]})
            if sr > best_sharpe:
                best_sharpe = sr
                max_sharpe_pt = pt
            if v_ann < min_vol:
                min_vol = v_ann
                min_var_pt = pt

    cur_invested_ret = float(invested_weights @ mean_ann_rets)
    cur_invested_vol = math.sqrt(max(float(invested_weights.T @ cov_ann @ invested_weights), 1e-12))
    current_pt = {
        "vol_pct": round(cur_invested_vol * 100.0, 2),
        "ret_pct": round(cur_invested_ret * 100.0, 2),
        "sharpe": round((cur_invested_ret - req.risk_free_rate) / cur_invested_vol, 2) if cur_invested_vol > 1e-9 else 0.0,
        "weights": {symbols[i]: round(float(invested_weights[i] * 100.0), 1) for i in range(n_assets)},
    }

    # Monte Carlo GBM Simulation
    rng = np.random.default_rng(abs(hash(req.user_id)) % (2**32))
    mu_d = float(port_returns.mean())
    sigma_d = float(port_returns.std(ddof=1))
    drift = mu_d - 0.5 * (sigma_d ** 2)
    shocks = rng.normal(0.0, 1.0, size=(req.num_simulations, req.horizon_days))
    paths = total_equity * np.cumprod(np.exp(drift + sigma_d * shocks), axis=1)
    full_paths = np.hstack([np.full((req.num_simulations, 1), total_equity), paths])

    monte_carlo = []
    for day in range(full_paths.shape[1]):
        col = full_paths[:, day]
        monte_carlo.append(
            {
                "day": day,
                "p5": round(float(np.percentile(col, 5)), 2),
                "p25": round(float(np.percentile(col, 25)), 2),
                "p50": round(float(np.percentile(col, 50)), 2),
                "p75": round(float(np.percentile(col, 75)), 2),
                "p95": round(float(np.percentile(col, 95)), 2),
            }
        )

    data_source = "YAHOO_FINANCE_LIVE" if "YAHOO_FINANCE_LIVE" in sources else list(sources)[0]
    return {
        "user_id": req.user_id,
        "benchmark_symbol": bench_sym,
        "data_source": data_source,
        "date_range": f"{returns_df.index[0]} → {returns_df.index[-1]}",
        "total_equity": round(total_equity, 2),
        "invested_value": round(total_holdings_val, 2),
        "cash_weight_pct": round((max(0.0, req.cash_balance) / total_equity) * 100.0, 1),
        "diversification_ratio": diversification_ratio,
        "effective_num_bets": eff_bets,
        "metrics": metrics,
        "rolling_series": rolling_series,
        "correlation_matrix": {"symbols": symbols, "matrix": corr_matrix},
        "risk_contributions": risk_contributions,
        "stress_scenarios": stress_scenarios,
        "efficient_frontier": {
            "cloud": cloud[:160],
            "current": current_pt,
            "max_sharpe": max_sharpe_pt,
            "min_variance": min_var_pt,
        },
        "monte_carlo": monte_carlo,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=False)

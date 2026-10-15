# QuantPilot 🚀

> **A multi-user stock-market research and paper-trading platform engineered for collaborative quantitative research.**

---

## ⚡ Overview

QuantPilot is a 5-user stock-market research workbench and realistic paper-trading simulator built strictly using **100% free-tier tools**:
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Visualization**: Recharts + Lucide React
- **Authentication & Database**: Supabase (PostgreSQL with Row Level Security)
- **AI Financial Intelligence**: Google AI Studio (Gemini Free Tier)
- **Version Control**: GitHub Private Repository
- **Quant Backend**: Designed for modular Python FastAPI integration

---

## 🛡️ Critical Financial & Security Principles

1. **No Promised Returns**:
   - The platform strictly rejects misleading claims such as "guaranteed 10% returns per trade".
   - Quantitative models provide probabilistic risk/reward scenarios, expected shortfall, and drawdown profiles.
2. **Deterministic Financial Math**:
   - Monetary accounting (cash, buying power, unrealized/realized P&L, fees, slippage) is executed deterministically.
   - LLMs are used for textual analysis and semantic reasoning, **never** for raw price or P&L math.
3. **Data Transparency**:
   - In Milestone 1, all data is explicitly labelled with a visible `DEMO DATA` banner. Synthetic data is never masqueraded as live market feeds.
4. **Strict Multi-User Isolation (RLS)**:
   - Designed for 5 individual users.
   - Every portfolio, position, order, and conversation thread is protected by PostgreSQL Row Level Security (`auth.uid() = user_id`).
   - Frontend filtering is never treated as a substitute for database-level security.

---

## 🗺️ Project Structure

```
quantpilot/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images and SVG icons
│   ├── components/
│   │   ├── layout/         # AppLayout, Sidebar, Header
│   │   └── ui/             # Reusable UI primitives
│   │       ├── Card.tsx
│   │       ├── StatCard.tsx
│   │       ├── DataTable.tsx
│   │       ├── MiniChart.tsx
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── LoadingState.tsx
│   │       ├── EmptyState.tsx
│   │       ├── ErrorState.tsx
│   │       └── DemoBanner.tsx
│   ├── data/
│   │   └── demo.ts         # Strictly labelled synthetic dataset
│   ├── lib/
│   │   └── utils.ts        # Currency, percentage, and time formatters
│   ├── pages/
│   │   ├── Dashboard.tsx   # Portfolio summary, charts, holdings, watchlist
│   │   ├── Markets.tsx     # Indices, sector performance, top gainers/losers
│   │   ├── Portfolio.tsx   # Asset allocation pie chart, detailed positions
│   │   ├── PaperTrading.tsx# Order entry form, pending orders, trade log
│   │   ├── Research.tsx    # Stock screener & quantitative model preview
│   │   ├── News.tsx        # Geopolitical & macroeconomic news feeds
│   │   ├── AIAssistant.tsx # Financial research chat with anti-hallucination guards
│   │   └── Settings.tsx    # 5-user team management & database RLS spec
│   ├── types/
│   │   └── index.ts        # TypeScript domain models with user_id
│   ├── App.tsx             # React Router structure
│   ├── index.css           # Tailwind CSS v4 styling & theme tokens
│   └── main.tsx            # React root mount
├── .env.example            # Safe credential placeholders
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚦 Roadmap

- [x] **Milestone 1: Foundation (Current)**
  - UI shell, responsive layout, 8 navigable core routes.
  - Reusable component design system (Cards, Tables, Charts, Form inputs, States).
  - Synthetic demo data with persistent transparency banners.
  - Zero-secret environment template and type definitions.
- [ ] **Milestone 2: Supabase Auth & PostgreSQL Schema**
  - Provision 5 user accounts.
  - Implement tables (`portfolios`, `holdings`, `orders`, `trades`, `chats`).
  - Deploy PostgreSQL RLS policies & verify cross-account isolation.
- [ ] **Milestone 3: Free Live Market Data Integration**
  - Connect free market data providers (e.g. Yahoo Finance / Alpha Vantage free tier).
  - Price cache and staleness invalidation.
- [ ] **Milestone 4: Realistic Paper-Trading Engine**
  - Deterministic order execution, simulated slippage, and fee deduction.
- [ ] **Milestone 5: Google AI Studio Integration**
  - Grounded Gemini assistant for fundamental & technical queries.
- [ ] **Milestone 6: 2-Hour Geopolitical & Macro News Pipeline**
  - Automated RSS/news polling with sentiment categorization.
- [ ] **Milestone 7: Virtual vs AI Benchmark Portfolio**
  - Side-by-side performance comparison.
- [ ] **Milestone 8: Production Deployment**
  - Free-tier hosting (Vercel / Netlify / Cloudflare Pages).

---

## 💻 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Run TypeScript Checks & Build
```bash
npm run build
```

---

## 🔒 Security Best Practices
- Never commit `.env` or `.env.local` to git.
- Privileged service-role keys must never be bundled into client-side code.
- Report all vulnerabilities through GitHub private vulnerability reporting.

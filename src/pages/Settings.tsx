// ============================================================
// QuantPilot — Multi-User Workspace, API Boundaries & Theme Control
// ============================================================

import { motion } from 'motion/react';
import { User, Shield, Database, Info, Check, Sun, Moon, Laptop } from 'lucide-react';
import DemoBanner from '@/components/ui/DemoBanner';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useTheme, type ThemeMode } from '@/context/ThemeContext';
import { usePortfolio } from '@/context/PortfolioContext';

export default function Settings() {
  const { allUsers, currentUser, switchUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { currency, resetPortfolio, backendConnected, pythonQuantOnline } = usePortfolio();

  return (
    <div className="space-y-5">
      <DemoBanner />

      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Workspace, API &amp; Account Isolation
        </h1>
        <p className="text-xs text-muted-foreground">
          Manage 5-seat user isolation, theme preference, and TypeScript/Python service boundaries
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Active Account Profile */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-brand" />
              <h2 className="text-sm font-semibold text-foreground">Active Authenticated Seat</h2>
            </div>
            <Badge variant="gain">Isolated Session</Badge>
          </div>
          <div className="space-y-2.5 divide-y divide-border text-xs">
            <div className="flex justify-between pt-2">
              <span className="text-muted-foreground">Display Name</span>
              <span className="font-semibold text-foreground">{currentUser.name}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-muted-foreground">Desk Role</span>
              <span className="font-medium text-brand">{currentUser.role}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-muted-foreground">Email</span>
              <span className="font-mono text-foreground">{currentUser.email}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-muted-foreground">User ID (X-User-Id / auth.uid)</span>
              <span className="font-mono text-muted-foreground">{currentUser.id}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-muted-foreground">Reporting Currency</span>
              <Badge variant="brand">{currentUser.preferredCurrency || currency}</Badge>
            </div>
          </div>
        </Card>

        {/* Appearance & Ledger Control */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-brand" />
              <h2 className="text-sm font-semibold text-foreground">Theme &amp; Ledger Reset</h2>
            </div>
            <Badge variant="neutral">Zinc / Obsidian</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">
            Select Light, Dark, or OS-matched System appearance.
          </p>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: 'light' as ThemeMode, label: 'Light', icon: Sun },
              { id: 'dark' as ThemeMode, label: 'Dark', icon: Moon },
              { id: 'system' as ThemeMode, label: 'System', icon: Laptop },
            ].map(({ id, label, icon: Icon }) => (
              <motion.button
                key={id}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => setTheme(id)}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                  theme === id
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </motion.button>
            ))}
          </div>

          <div className="mt-5 pt-3.5 border-t border-border flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-foreground block">Reset Active Seat Ledger</span>
              <span className="text-[11px] text-muted-foreground">
                Restores initial seed holdings &amp; cash for {currentUser.name}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={resetPortfolio}>
              Reset Ledger
            </Button>
          </div>
        </Card>

        {/* 5-Seat Account Switcher */}
        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-brand" />
              <h2 className="text-sm font-semibold text-foreground">5-Seat Multi-User Isolation Switcher</h2>
            </div>
            <Badge variant="info">X-User-Id Scoped</Badge>
          </div>
          <p className="mb-3.5 text-[11px] text-muted-foreground">
            Switch between provisioned research seats. Every account maintains segregated holdings, order matching books, strategy backtests, and AI context.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {allUsers.map((u) => {
              const isActive = u.id === currentUser.id;
              return (
                <motion.button
                  key={u.id}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => switchUser(u.id)}
                  className={`flex flex-col justify-between text-left rounded-md border p-3 cursor-pointer transition-colors ${
                    isActive
                      ? 'border-brand bg-brand/10 ring-1 ring-brand/40'
                      : 'border-border bg-secondary/40 hover:border-brand/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-foreground">{u.name}</span>
                      {isActive && <Check className="h-3.5 w-3.5 text-gain" />}
                    </div>
                    <span className="block text-[11px] text-brand font-medium">{u.role}</span>
                    <span className="block font-mono text-[10px] text-muted-foreground mt-1 truncate">
                      {u.email}
                    </span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                    <span>{u.preferredCurrency}</span>
                    <span>{u.id}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </Card>

        {/* REST API & RLS Specification */}
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <Database className="h-4 w-4 text-brand" />
            <h2 className="text-sm font-semibold text-foreground">API &amp; RLS Isolation Boundaries</h2>
          </div>
          <div className="space-y-3 text-xs text-muted-foreground">
            <p>
              REST requests scope every ledger mutation via <code className="font-mono text-foreground">X-User-Id</code> alongside PostgreSQL Row Level Security:
            </p>
            <pre className="rounded-md border border-border bg-surface-dark p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto">
{`POST   /api/orders              (Deterministic Match + Slippage)
POST   /api/market/tick         (Quote Tick + Limit/Stop Matcher)
POST   /api/quant/backtest      (Python NumPy/Pandas Pipeline)
POST   /api/quant/portfolio-risk (Covariance, VaR, Monte Carlo)
GET    /api/quant/leaderboard   (Multi-User Strategy Evaluation)`}
            </pre>
          </div>
        </Card>

        {/* System Architecture Telemetry */}
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-brand" />
            <h2 className="text-sm font-semibold text-foreground">Runtime Stack Telemetry</h2>
          </div>
          <div className="space-y-2.5 divide-y divide-border text-xs">
            <div className="flex justify-between pt-2">
              <span className="text-muted-foreground">Frontend Stack</span>
              <span className="font-mono text-foreground">React 19 · TS · shadcn/ui · Motion · React Bits</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-muted-foreground">REST Gateway</span>
              <Badge variant={backendConnected ? 'gain' : 'warning'}>
                {backendConnected ? 'Node.js / Express Online' : 'Local Fallback'}
              </Badge>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-muted-foreground">Quant Compute Engine</span>
              <Badge variant={pythonQuantOnline ? 'gain' : 'info'}>
                {pythonQuantOnline ? 'Python FastAPI (NumPy + Pandas)' : 'TS Deterministic Fallback'}
              </Badge>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-muted-foreground">Supported Markets</span>
              <span className="font-mono text-foreground">NSE (INR) &amp; NASDAQ/NYSE (USD)</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

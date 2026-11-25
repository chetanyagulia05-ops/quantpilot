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
  const { currency, resetPortfolio } = usePortfolio();

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Settings & Account Control</h1>
        <p className="text-sm text-text-secondary">
          Manage 5-user workspace isolation, visual themes, currency preferences, and security specifications
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Active Account Profile */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-brand" />
              <h2 className="text-base font-semibold text-text-primary">Active Profile</h2>
            </div>
            <Badge variant="gain">Active Session</Badge>
          </div>
          <div className="space-y-3 divide-y divide-border text-sm">
            <div className="flex justify-between pt-2">
              <span className="text-text-secondary">User Display Name:</span>
              <span className="font-semibold text-text-primary">{currentUser.name}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-text-secondary">Assigned Role:</span>
              <span className="font-medium text-brand">{currentUser.role}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-text-secondary">Email Address:</span>
              <span className="font-mono text-xs text-text-primary">{currentUser.email}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-text-secondary">User UUID (auth.uid):</span>
              <span className="font-mono text-xs text-text-muted">{currentUser.id}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-text-secondary">Preferred Base Currency:</span>
              <Badge variant="brand">{currentUser.preferredCurrency || currency}</Badge>
            </div>
          </div>
        </Card>

        {/* Visual Appearance & Themes */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-brand" />
              <h2 className="text-base font-semibold text-text-primary">Appearance & Themes</h2>
            </div>
            <Badge variant="neutral">Stored in LocalStorage</Badge>
          </div>
          <p className="text-xs text-text-muted mb-4">
            Select your preferred display theme. System mode automatically mirrors your operating system preference.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light' as ThemeMode, label: 'Light', icon: Sun },
              { id: 'dark' as ThemeMode, label: 'Dark', icon: Moon },
              { id: 'system' as ThemeMode, label: 'System', icon: Laptop },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                  theme === id
                    ? 'border-brand bg-brand/10 text-brand shadow-sm ring-1 ring-brand'
                    : 'border-border bg-surface-secondary text-text-secondary hover:text-text-primary hover:border-border/80'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-text-primary block">Paper Trading Ledger Reset</span>
              <span className="text-[11px] text-text-muted">Restore initial seed holdings and wipe paper trades</span>
            </div>
            <Button variant="outline" size="sm" onClick={resetPortfolio}>
              Reset Ledger
            </Button>
          </div>
        </Card>

        {/* 5-User Team Switcher */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand" />
              <h2 className="text-base font-semibold text-text-primary">5-Seat Account Isolation Switcher</h2>
            </div>
            <Badge variant="info">Strict Row-Level Isolation</Badge>
          </div>
          <p className="mb-4 text-xs text-text-muted">
            Click any user profile below to simulate instant authenticated login switching. Each account features completely segregated portfolio holdings, paper order history, and conversational AI orb message logs.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {allUsers.map((u) => {
              const isActive = u.id === currentUser.id;
              return (
                <div
                  key={u.id}
                  onClick={() => switchUser(u.id)}
                  className={`flex flex-col justify-between rounded-lg border p-3 cursor-pointer transition-all ${
                    isActive
                      ? 'border-brand bg-brand/10 shadow-sm ring-2 ring-brand/50'
                      : 'border-border bg-surface-secondary hover:border-brand/40 hover:bg-surface'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-text-primary">{u.name}</span>
                      {isActive && (
                        <span className="flex items-center text-xs text-gain font-semibold">
                          <Check className="h-3.5 w-3.5 mr-0.5" /> Active
                        </span>
                      )}
                    </div>
                    <span className="block text-xs text-brand font-medium">{u.role}</span>
                    <span className="block text-[11px] text-text-muted mt-1 truncate">{u.email}</span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[11px] text-text-secondary">
                    <span>Base: {u.preferredCurrency}</span>
                    <span className="font-mono text-[10px] text-text-muted">{u.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Database & Security Architecture */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-brand" />
            <h2 className="text-base font-semibold text-text-primary">Database & Security Architecture</h2>
          </div>
          <div className="space-y-3 text-xs text-text-secondary">
            <p>
              QuantPilot enforces <strong>Supabase PostgreSQL</strong> Row Level Security (RLS) policies on all tables:
            </p>
            <div className="rounded-lg bg-surface-dark p-3 font-mono text-[11px] text-green-400 overflow-x-auto">
              -- Enforce strict 5-user account isolation<br />
              ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;<br />
              ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;<br />
              ALTER TABLE paper_orders ENABLE ROW LEVEL SECURITY;<br />
              <br />
              CREATE POLICY &quot;users_manage_own_portfolio&quot;<br />
              &nbsp;&nbsp;ON portfolios FOR ALL<br />
              &nbsp;&nbsp;USING (auth.uid() = user_id);
            </div>
            <p className="text-text-muted">
              Zero cross-account data leakage is guaranteed across portfolios, orders, and conversational AI orb contexts.
            </p>
          </div>
        </Card>

        {/* System & Architecture Specifications */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Info className="h-5 w-5 text-brand" />
            <h2 className="text-base font-semibold text-text-primary">QuantPilot System Specifications</h2>
          </div>
          <div className="space-y-3 divide-y divide-border text-xs text-text-secondary">
            <div className="flex justify-between pt-2">
              <span>Frontend Architecture:</span>
              <span className="font-medium text-text-primary">React 19 + TypeScript + Vite + Tailwind CSS v4</span>
            </div>
            <div className="flex justify-between pt-2">
              <span>Primary Markets & Currencies:</span>
              <span className="font-medium text-text-primary">NSE / BSE (INR ₹ Lakhs/Crores) & US (USD $)</span>
            </div>
            <div className="flex justify-between pt-2">
              <span>Database & Authentication:</span>
              <span className="font-medium text-text-primary">Supabase (PostgreSQL 15 + RLS Engine)</span>
            </div>
            <div className="flex justify-between pt-2">
              <span>In-Page Conversational AI:</span>
              <span className="font-medium text-text-primary">Google AI Studio (Gemini 1.5 Pro / Flash)</span>
            </div>
            <div className="flex justify-between pt-2">
              <span>Quantitative Service:</span>
              <span className="font-medium text-text-primary">Modular Python FastAPI Microservice Architecture</span>
            </div>
            <div className="flex justify-between pt-2">
              <span>Release Track:</span>
              <Badge variant="warning">Milestone 2: Multi-Asset Lab & Floating AI Orb</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

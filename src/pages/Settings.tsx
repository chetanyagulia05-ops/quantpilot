import { User, Shield, Database, Info, Check } from 'lucide-react';
import DemoBanner from '@/components/ui/DemoBanner';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

export default function Settings() {
  const usersList = [
    { id: 'usr-1', email: 'alice@quantpilot.app', role: 'Quant Trader 1', active: true },
    { id: 'usr-2', email: 'bob@quantpilot.app', role: 'Quant Trader 2', active: false },
    { id: 'usr-3', email: 'charlie@quantpilot.app', role: 'Macro Researcher', active: false },
    { id: 'usr-4', email: 'diana@quantpilot.app', role: 'Risk Analyst', active: false },
    { id: 'usr-5', email: 'evan@quantpilot.app', role: 'Portfolio Manager', active: false },
  ];

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary">
          Manage individual user profiles, multi-user isolation, and security configuration
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Account Info */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-brand" />
            <h2 className="text-base font-semibold text-text-primary">Active Profile (Demo)</h2>
          </div>
          <div className="space-y-3 divide-y divide-border-light text-sm">
            <div className="flex justify-between pt-2">
              <span className="text-text-secondary">User Display Name:</span>
              <span className="font-medium text-text-primary">Quant Trader #1</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-text-secondary">Email Address:</span>
              <span className="font-medium text-text-primary">alice@quantpilot.app</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-text-secondary">Assigned User UUID:</span>
              <span className="font-mono text-xs text-text-muted">demo-user-001</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-text-secondary">Account Status:</span>
              <Badge variant="gain">Authenticated (Demo)</Badge>
            </div>
          </div>
        </Card>

        {/* 5-User Team Multi-Tenancy */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand" />
              <h2 className="text-base font-semibold text-text-primary">Team Accounts (5 Users)</h2>
            </div>
            <Badge variant="info">5-Seat Planned</Badge>
          </div>
          <p className="mb-3 text-xs text-text-muted">
            Each user maintains a completely isolated portfolio and order book. No cross-account data leakage.
          </p>
          <div className="space-y-2">
            {usersList.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary px-3 py-2 text-xs"
              >
                <div>
                  <span className="font-semibold text-text-primary">{u.role}</span>
                  <span className="block text-text-muted">{u.email}</span>
                </div>
                {u.active ? (
                  <span className="flex items-center gap-1 font-semibold text-gain">
                    <Check className="h-3.5 w-3.5" /> Logged In
                  </span>
                ) : (
                  <span className="text-text-muted">Provisioned</span>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Database & Security Architecture */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-brand" />
            <h2 className="text-base font-semibold text-text-primary">Database & RLS Architecture</h2>
          </div>
          <div className="space-y-2 text-xs text-text-secondary">
            <p>
              QuantPilot is configured for <strong>Supabase PostgreSQL</strong> with Row Level Security (RLS)
              mandates:
            </p>
            <div className="rounded-lg bg-surface-dark p-3 font-mono text-[11px] text-green-400">
              CREATE POLICY &quot;user_isolation&quot; ON portfolios<br />
              &nbsp;&nbsp;FOR ALL<br />
              &nbsp;&nbsp;USING (auth.uid() = user_id);
            </div>
            <p className="text-text-muted">
              Every portfolio, trade, holding, and AI chat thread is bound strictly to `auth.uid()`.
            </p>
          </div>
        </Card>

        {/* System & Architecture */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Info className="h-5 w-5 text-brand" />
            <h2 className="text-base font-semibold text-text-primary">App Specification</h2>
          </div>
          <div className="space-y-3 divide-y divide-border-light text-xs text-text-secondary">
            <div className="flex justify-between pt-2">
              <span>Frontend Stack:</span>
              <span className="font-medium text-text-primary">React 19 + TypeScript + Vite + Tailwind</span>
            </div>
            <div className="flex justify-between pt-2">
              <span>Database & Auth:</span>
              <span className="font-medium text-text-primary">Supabase (PostgreSQL + RLS)</span>
            </div>
            <div className="flex justify-between pt-2">
              <span>Quant Backend:</span>
              <span className="font-medium text-text-primary">Modular API (Python FastAPI planned)</span>
            </div>
            <div className="flex justify-between pt-2">
              <span>AI Engine:</span>
              <span className="font-medium text-text-primary">Google AI Studio (Gemini Free Tier)</span>
            </div>
            <div className="flex justify-between pt-2">
              <span>Active Milestone:</span>
              <Badge variant="warning">Milestone 1: Foundation (Demo Mode)</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

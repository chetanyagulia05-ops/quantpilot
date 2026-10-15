import { AlertTriangle } from 'lucide-react';

/**
 * Persistent banner displayed on every page to indicate
 * that all data shown is synthetic demo data.
 */
export default function DemoBanner() {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-warning bg-warning-light px-4 py-2.5 text-sm">
      <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
      <span className="font-medium text-warning">DEMO DATA</span>
      <span className="text-amber-800">
        — All values shown are synthetic and for UI development only. Not real market data.
      </span>
    </div>
  );
}

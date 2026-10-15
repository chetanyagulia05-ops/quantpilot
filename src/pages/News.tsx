import { useState } from 'react';
import { Newspaper, ExternalLink, Globe } from 'lucide-react';
import DemoBanner from '@/components/ui/DemoBanner';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/utils';
import { demoNews } from '@/data/demo';

const CATEGORIES = [
  { id: 'all', label: 'All Updates' },
  { id: 'geopolitical', label: 'Geopolitical' },
  { id: 'economy', label: 'Macro & Economy' },
  { id: 'company', label: 'Company Earnings' },
  { id: 'market', label: 'Market Flow' },
];

export default function News() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredNews = demoNews.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category.toLowerCase() === activeCategory.toLowerCase();
  });

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Market Intelligence & News</h1>
          <p className="text-sm text-text-secondary">
            Continuous macroeconomic feeds, geopolitical developments, and market catalysts
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted bg-surface-secondary px-3 py-1.5 rounded-lg border border-border">
          <Globe className="h-4 w-4 text-brand" />
          <span>Polling interval: 2 hours (Planned)</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              activeCategory === cat.id
                ? 'bg-brand text-white shadow-sm'
                : 'bg-surface text-text-secondary border border-border hover:bg-surface-secondary'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* News List */}
      <div className="space-y-4">
        {filteredNews.map((article) => (
          <Card key={article.id} className="transition-all hover:border-brand/40 hover:shadow-sm">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand">
                      {article.source}
                    </span>
                    <span className="text-xs text-text-muted">•</span>
                    <span className="text-xs text-text-muted">
                      {formatRelativeTime(article.published_at)}
                    </span>
                    <Badge
                      variant={
                        article.sentiment === 'positive'
                          ? 'gain'
                          : article.sentiment === 'negative'
                          ? 'loss'
                          : 'neutral'
                      }
                    >
                      {article.sentiment}
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-text-primary hover:text-brand transition-colors cursor-pointer">
                    {article.title}
                  </h3>
                </div>
                <a
                  href={article.url}
                  onClick={(e) => e.preventDefault()}
                  className="rounded-md p-1.5 text-text-muted hover:bg-surface-secondary hover:text-text-primary"
                  title="Simulated external source link"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <p className="text-sm leading-relaxed text-text-secondary">{article.summary}</p>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-light">
                <span className="text-xs text-text-muted">Impacted Tickers:</span>
                {article.related_symbols.map((sym) => (
                  <span
                    key={sym}
                    className="rounded bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand"
                  >
                    ${sym}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 text-center text-xs text-text-muted">
        <Newspaper className="mx-auto mb-1 h-5 w-5 text-text-muted" />
        All articles shown are synthetic representations for UI milestone verification. RSS feeds and live geopolitical news scrapers will activate in Milestone 6.
      </div>
    </div>
  );
}

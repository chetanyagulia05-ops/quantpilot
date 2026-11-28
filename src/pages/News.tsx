// ============================================================
// QuantPilot — Live Macro, Geopolitical & Catalyst News Feed
// Fetches real-time Yahoo Finance headlines with sentiment tagging
// and clickable links to external articles & Chart Lab tickers.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Globe, ExternalLink, RefreshCw } from 'lucide-react';
import DemoBanner from '@/components/ui/DemoBanner';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { formatRelativeTime } from '@/lib/utils';
import { quantApi } from '@/lib/api';
import { demoNews } from '@/data/demo';

interface LiveArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  published_at: string;
  url: string;
  category: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  related_symbols: string[];
}

export default function News() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<'all' | 'geopolitical' | 'economy' | 'company' | 'market'>('all');
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<LiveArticle[]>(demoNews);
  const [dataSource, setDataSource] = useState('LOADING');
  const [loading, setLoading] = useState(false);

  const loadNews = useCallback(async (refresh = false) => {
    setLoading(true);
    try {
      const res = await quantApi.getNews(refresh);
      if (res.articles && res.articles.length > 0) {
        setArticles(res.articles);
        setDataSource(res.data_source || 'YAHOO_FINANCE_LIVE');
      }
    } catch {
      setDataSource('OFFLINE_FALLBACK');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews(false);
  }, [loadNews]);

  const filteredNews = articles.filter((item) => {
    const matchesCategory =
      activeCategory === 'all' || item.category.toLowerCase() === activeCategory.toLowerCase();
    const q = query.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      item.related_symbols.some((s) => s.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-5">
      <DemoBanner />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Macro &amp; Catalyst Intelligence
            </h1>
            <Badge variant={dataSource.startsWith('YAHOO') ? 'gain' : 'neutral'}>
              {dataSource.startsWith('YAHOO') ? 'Live Yahoo Finance' : 'Snapshot'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Live sentiment-tagged market, macro, and earnings headlines mapped to tracked tickers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
            <Globe className="h-3.5 w-3.5 text-brand" />
            <span>{articles.length} HEADLINES</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            loading={loading}
            icon={<RefreshCw className="h-3.5 w-3.5 text-gain" />}
            onClick={() => loadNews(true)}
          >
            Refresh Feed
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedControl
          layoutId="news-category-tab"
          size="sm"
          value={activeCategory}
          onChange={setActiveCategory}
          options={[
            { value: 'all', label: 'All' },
            { value: 'geopolitical', label: 'Geopolitical' },
            { value: 'economy', label: 'Macro' },
            { value: 'company', label: 'Earnings' },
            { value: 'market', label: 'Flows' },
          ]}
        />

        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter headlines or $TICKER..."
            className="w-full rounded-md border border-border bg-card pl-8 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* News Feed */}
      <div className="space-y-3">
        {filteredNews.length === 0 ? (
          <Card className="py-10 text-center text-xs text-muted-foreground">
            No headlines match your current filter.
          </Card>
        ) : (
          filteredNews.map((article) => (
            <Card key={article.id} className="hover:border-brand/40 transition-colors">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-brand">
                      {article.source}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
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
                      {article.sentiment.toUpperCase()}
                    </Badge>
                  </div>
                  {article.url && article.url !== '#' && (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      title="Read original article"
                      aria-label={`Read ${article.title}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>

                <h2 className="text-sm font-semibold text-foreground">{article.title}</h2>
                <p className="text-xs leading-relaxed text-muted-foreground">{article.summary}</p>

                <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2.5">
                  <span className="text-[11px] text-muted-foreground mr-1">Inspect in Chart Lab:</span>
                  {article.related_symbols.map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => navigate(`/chart-lab?symbol=${sym}&tf=1D`)}
                      className="rounded border border-brand/25 bg-brand/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-brand hover:bg-brand/20 transition-colors cursor-pointer"
                    >
                      ${sym}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

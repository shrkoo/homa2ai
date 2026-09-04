import React, { useState, useEffect, useMemo } from 'react';
import { Store, ExternalLink, ChevronDown, ChevronUp, AlertTriangle, Globe, FileText, Columns3, X } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import ProductTable, { productKey } from './ProductTable';
import FilterToolbar from './FilterToolbar';
import ComparisonDashboard from './ComparisonDashboard';
import StoreFilterMenu from './StoreFilterMenu';
import SearchHistoryBar from './SearchHistoryBar';

function faviconFor(site) {
  if (!site) return '';
  return `https://www.google.com/s2/favicons?domain=${site}&sz=64`;
}

function WebResultCard({ item }) {
  const favicon = item.favicon || faviconFor(item.site || item.url);
  return (
    <a href={item.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-border bg-card p-3.5 hover:bg-accent/40 transition-colors">
      <div className="flex items-start gap-3">
        {favicon ? (
          <img src={favicon} alt="" className="w-8 h-8 rounded-lg shrink-0 bg-accent" onError={(e) => { e.target.style.display = 'none'; }} />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <FileText size={14} className="text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug line-clamp-2">{item.title}</p>
          {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <Globe size={11} />
            <span className="truncate">{item.site || item.url}</span>
          </div>
        </div>
        <ExternalLink size={14} className="text-muted-foreground shrink-0 mt-1" />
      </div>
    </a>
  );
}

function SourceItem({ source }) {
  return (
    <a href={source.url} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-accent/50 transition-colors">
      {source.favicon ? (
        <img src={source.favicon} alt="" className="w-5 h-5 rounded shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
      ) : (
        <div className="w-5 h-5 rounded bg-accent flex items-center justify-center shrink-0">
          <ExternalLink size={10} className="text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{source.title || source.site || source.url}</p>
        <p className="text-xs text-muted-foreground truncate">{source.site || source.url}</p>
      </div>
      <ExternalLink size={12} className="text-muted-foreground shrink-0" />
    </a>
  );
}

function parsePrice(p) {
  if (typeof p === 'number') return p;
  const n = parseFloat(String(p || '').replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
}

export default function GlobalSearchResults({ data }) {
  const { t } = useI18n();
  const [tab, setTab] = useState('stores');
  const [showSources, setShowSources] = useState(false);
  const [sort, setSort] = useState('relevance');
  const [stockFilter, setStockFilter] = useState(null);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [compareOpen, setCompareOpen] = useState(false);
  const [selectedStores, setSelectedStores] = useState(new Set());

  const rawProducts = data?.results || [];
  const webResults = data?.web_results || [];
  const sources = data?.sources || [];
  const limited = data?.limited;

  const hasStockInfo = rawProducts.some(p => p.in_stock === true || p.in_stock === false || p.in_stock === 'true' || p.in_stock === 'false');
  const hasPrices = rawProducts.some(p => parsePrice(p.price) !== null);

  const priceBounds = useMemo(() => {
    const prices = rawProducts.map(p => parsePrice(p.price)).filter(p => p !== null);
    if (!prices.length) return null;
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [rawProducts]);

  const products = useMemo(() => {
    let result = [...rawProducts];
    if (selectedStores.size > 0) {
      const domains = [...selectedStores];
      result = result.filter(p => {
        if (!p.url) return false;
        return domains.some(d => p.url.includes(d));
      });
    }
    if (stockFilter === 'in_stock') {
      result = result.filter(p => p.in_stock === true || p.in_stock === 'true');
    }
    const min = priceMin !== '' && priceMin != null ? Number(priceMin) : null;
    const max = priceMax !== '' && priceMax != null ? Number(priceMax) : null;
    if (min !== null || max !== null) {
      result = result.filter(p => {
        const price = parsePrice(p.price);
        if (price === null) return false;
        if (min !== null && price < min) return false;
        if (max !== null && price > max) return false;
        return true;
      });
    }
    if (sort === 'price_low') {
      result.sort((a, b) => (parsePrice(a.price) ?? Infinity) - (parsePrice(b.price) ?? Infinity));
    } else if (sort === 'price_high') {
      result.sort((a, b) => (parsePrice(b.price) ?? 0) - (parsePrice(a.price) ?? 0));
    }
    return result;
  }, [rawProducts, sort, stockFilter, priceMin, priceMax, selectedStores]);

  const hasProducts = products.length > 0;
  const hasWeb = webResults.length > 0;

  useEffect(() => {
    if (!hasProducts && hasWeb) setTab('web');
    else if (hasProducts && !hasWeb) setTab('stores');
  }, [hasProducts, hasWeb]);

  // Clear selection when data changes
  useEffect(() => {
    setSelected(new Set());
    setSelectedStores(new Set());
  }, [data]);

  const onToggleSelect = (key) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectedProducts = rawProducts.filter(p => selected.has(productKey(p)));
  const compareCount = selected.size;

  const onToggleStore = (domain) => {
    setSelectedStores(prev => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  };

  const onSearchInStores = () => {
    const baseQuery = data?.query || '';
    if (!baseQuery || selectedStores.size === 0) return;
    const siteQuery = `(site:${[...selectedStores].join(' OR site:')})`;
    window.dispatchEvent(new CustomEvent('homa-rerun-search', { detail: { query: `${baseQuery} ${siteQuery}` } }));
  };

  if (!hasProducts && !hasWeb && !sources.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">{t('gs_no_results')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {limited && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">{t('gs_limited_note')}</p>
        </div>
      )}

      {rawProducts.length > 0 && (
        <StoreFilterMenu
          selectedStores={selectedStores}
          onToggleStore={onToggleStore}
          onSearchInStores={onSearchInStores}
          hasResults={rawProducts.length > 0}
        />
      )}

      {rawProducts.length > 0 && (
        <FilterToolbar
          sort={sort} setSort={setSort}
          stockFilter={stockFilter} setStockFilter={setStockFilter}
          hasStockInfo={hasStockInfo}
          priceMin={priceMin} setPriceMin={setPriceMin}
          priceMax={priceMax} setPriceMax={setPriceMax}
          hasPrices={hasPrices}
          priceBounds={priceBounds}
        />
      )}

      {/* Compare bar */}
      {compareCount >= 2 && tab === 'stores' && (
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-primary/10 border border-primary/20">
          <span className="text-sm font-medium text-primary">
            {t('gs_compare_count').replace('{n}', compareCount)}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelected(new Set())}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1"
            >
              <X size={12} /> {t('gs_clear')}
            </button>
            <button
              onClick={() => setCompareOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Columns3 size={14} /> {t('gs_compare')}
            </button>
          </div>
        </div>
      )}

      {(hasProducts || hasWeb) && (
        <div className="flex gap-1 p-1 rounded-xl bg-accent/60">
          {rawProducts.length > 0 && (
            <button onClick={() => setTab('stores')} className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium transition-colors ${tab === 'stores' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
              <Store size={13} /> {t('gs_tab_stores')} ({products.length})
            </button>
          )}
          {hasWeb && (
            <button onClick={() => setTab('web')} className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium transition-colors ${tab === 'web' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
              <Globe size={13} /> {t('gs_tab_web')} ({webResults.length})
            </button>
          )}
        </div>
      )}

      {tab === 'stores' && hasProducts && (
        <ProductTable products={products} sort={sort} selected={selected} onToggleSelect={onToggleSelect} />
      )}

      {tab === 'web' && hasWeb && webResults.map((r, i) => (
        <WebResultCard key={i} item={r} />
      ))}

      {sources.length > 0 && (
        <div className="pt-1">
          <button onClick={() => setShowSources((v) => !v)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent hover:bg-accent/70 transition-colors text-xs font-medium">
            {showSources ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {t('gs_sources_count')} ({sources.length})
          </button>
          {showSources && (
            <div className="mt-2 rounded-2xl border border-border bg-card p-1.5 space-y-0.5">
              {sources.map((s, i) => (<SourceItem key={i} source={s} />))}
            </div>
          )}
        </div>
      )}

      {compareOpen && selectedProducts.length >= 2 && (
        <ComparisonDashboard
          products={selectedProducts}
          onClose={() => setCompareOpen(false)}
        />
      )}

      <SearchHistoryBar />
    </div>
  );
}
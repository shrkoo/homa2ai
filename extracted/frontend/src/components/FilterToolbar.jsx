import React, { useState } from 'react';
import { TrendingDown, TrendingUp, Star, Check, SlidersHorizontal, X } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

export default function FilterToolbar({ sort, setSort, stockFilter, setStockFilter, hasStockInfo, priceMin, setPriceMin, priceMax, setPriceMax, hasPrices, priceBounds }) {
  const { t } = useI18n();
  const [showPriceFilter, setShowPriceFilter] = useState(false);

  const sortOptions = [
    { key: 'relevance', label: t('gs_sort_relevance'), icon: Star },
    { key: 'price_low', label: t('gs_sort_price_low'), icon: TrendingDown },
    { key: 'price_high', label: t('gs_sort_price_high'), icon: TrendingUp },
  ];

  const priceActive = (priceMin !== '' && priceMin != null) || (priceMax !== '' && priceMax != null);

  // Slider bounds
  const bMin = priceBounds?.min ?? 0;
  const bMax = priceBounds?.max ?? 1000;
  const hasSlider = priceBounds && bMax > bMin;
  const step = Math.max(1, Math.round((bMax - bMin) / 100));

  const lowVal = (priceMin !== '' && priceMin != null) ? Number(priceMin) : bMin;
  const highVal = (priceMax !== '' && priceMax != null) ? Number(priceMax) : bMax;
  const lowPct = hasSlider ? ((lowVal - bMin) / (bMax - bMin)) * 100 : 0;
  const highPct = hasSlider ? ((highVal - bMin) / (bMax - bMin)) * 100 : 100;

  const handleLowChange = (e) => {
    const v = Number(e.target.value);
    if (v <= highVal) setPriceMin(v <= bMin ? '' : v);
  };
  const handleHighChange = (e) => {
    const v = Number(e.target.value);
    if (v >= lowVal) setPriceMax(v >= bMax ? '' : v);
  };

  const reset = () => { setPriceMin(''); setPriceMax(''); };

  const fmtVal = (v) => v.toLocaleString('en-US');

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {sortOptions.map(opt => (
          <button
            key={opt.key}
            onClick={() => setSort(opt.key)}
            className={`shrink-0 inline-flex items-center gap-1 px-2.5 h-7 rounded-full text-xs font-medium transition-colors ${sort === opt.key ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground hover:bg-accent/70'}`}
          >
            <opt.icon size={11} /> {opt.label}
          </button>
        ))}
        {hasStockInfo && (
          <button
            onClick={() => setStockFilter(stockFilter === 'in_stock' ? null : 'in_stock')}
            className={`shrink-0 inline-flex items-center gap-1 px-2.5 h-7 rounded-full text-xs font-medium transition-colors ${stockFilter === 'in_stock' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-accent text-muted-foreground hover:bg-accent/70'}`}
          >
            <Check size={11} /> {t('gs_in_stock')}
          </button>
        )}
        {hasPrices && (
          <button
            onClick={() => setShowPriceFilter(v => !v)}
            className={`shrink-0 inline-flex items-center gap-1 px-2.5 h-7 rounded-full text-xs font-medium transition-colors ${priceActive ? 'bg-primary/15 text-primary' : 'bg-accent text-muted-foreground hover:bg-accent/70'}`}
          >
            <SlidersHorizontal size={11} /> {t('gs_price_filter')}
            {priceActive && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
          </button>
        )}
      </div>

      {showPriceFilter && hasPrices && (
        <div className="p-3 rounded-xl bg-accent/50 space-y-2.5">
          {hasSlider ? (
            <>
              {/* Dual-range slider */}
              <div className="relative h-6 flex items-center">
                <div className="absolute inset-x-0 h-1.5 rounded-full bg-border" />
                <div
                  className="absolute h-1.5 rounded-full bg-primary"
                  style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }}
                />
                <input
                  type="range"
                  min={bMin}
                  max={bMax}
                  step={step}
                  value={lowVal}
                  onChange={handleLowChange}
                  className="absolute inset-0 w-full h-6 appearance-none bg-transparent pointer-events-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:pointer-events-auto
                    [&::-webkit-slider-thumb]:cursor-grab
                    [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background
                    [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:cursor-grab
                    [&::-moz-range-thumb]:border-none"
                />
                <input
                  type="range"
                  min={bMin}
                  max={bMax}
                  step={step}
                  value={highVal}
                  onChange={handleHighChange}
                  className="absolute inset-0 w-full h-6 appearance-none bg-transparent pointer-events-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:pointer-events-auto
                    [&::-webkit-slider-thumb]:cursor-grab
                    [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background
                    [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:cursor-grab
                    [&::-moz-range-thumb]:border-none"
                />
              </div>
              {/* Value labels */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">{t('gs_price_min')}:</span>
                  <span className="font-bold tabular-nums">{fmtVal(lowVal)}</span>
                </div>
                {priceActive && (
                  <button
                    onClick={reset}
                    className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <X size={11} /> {t('gs_clear')}
                  </button>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">{t('gs_price_max')}:</span>
                  <span className="font-bold tabular-nums">{fmtVal(highVal)}</span>
                </div>
              </div>
            </>
          ) : (
            /* Fallback: number inputs when bounds unavailable */
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                inputMode="numeric"
                placeholder={t('gs_price_min')}
                value={priceMin ?? ''}
                onChange={(e) => setPriceMin(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-20 h-7 px-2 rounded-lg bg-card text-xs outline-none border border-border/50"
              />
              <span className="text-xs text-muted-foreground">—</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder={t('gs_price_max')}
                value={priceMax ?? ''}
                onChange={(e) => setPriceMax(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-20 h-7 px-2 rounded-lg bg-card text-xs outline-none border border-border/50"
              />
              {priceActive && (
                <button
                  onClick={reset}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-card text-muted-foreground hover:text-foreground"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
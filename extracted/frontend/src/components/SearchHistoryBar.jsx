import React, { useState, useEffect } from 'react';
import { History, X, ChevronDown, ChevronUp, Search, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { dataAdapter } from '@/lib/adapters';

export default function SearchHistoryBar() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const load = async () => {
    setLoading(true);
    try { setItems(await dataAdapter.list('SearchHistory','-created_date', 15)); } catch {}
    setLoading(false);
  };

  useEffect(() => { if (open) load(); }, [open]);

  const handleRerun = (query) => {
    window.dispatchEvent(new CustomEvent('homa-rerun-search', { detail: { query } }));
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await dataAdapter.delete('SearchHistory', id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch {}
  };

  if (items.length === 0 && !open) return null;

  return (
    <div className="pt-1">
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent hover:bg-accent/70 transition-colors text-xs font-medium"
      >
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        <History size={13} /> {t('gs_recent_searches')}
      </button>
      {open && (
        <div className="mt-2 rounded-2xl border border-border bg-card p-3">
          {loading ? (
            <div className="flex items-center justify-center py-3"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">{t('gs_no_recent_searches')}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleRerun(item.query)}
                  className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-accent/60 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer text-xs font-medium"
                >
                  <Search size={11} className="text-muted-foreground group-hover:text-primary" />
                  <span className="max-w-[180px] truncate">{item.query}</span>
                  {item.result_count > 0 && <span className="text-muted-foreground/60 tabular-nums">({item.result_count})</span>}
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 rounded-full hover:bg-destructive/15 hover:text-destructive flex items-center justify-center"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
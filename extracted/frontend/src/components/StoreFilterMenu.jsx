import React, { useState, useEffect } from 'react';
import { Store, Plus, X, ChevronDown, ChevronUp, Search, Loader2, Trash2, Check } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { dataAdapter } from '@/lib/adapters';
import { toast } from '@/components/ui/use-toast';

const CATEGORIES = ['general', 'electronics', 'fashion', 'home', 'beauty', 'books', 'sports'];

function faviconFor(domain) {
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

export default function StoreFilterMenu({ selectedStores, onToggleStore, onSearchInStores, hasResults }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setStores(await dataAdapter.list('FavoriteStore','category', 50)); } catch {}
    setLoading(false);
  };

  useEffect(() => { if (open) load(); }, [open]);

  const handleAdd = async () => {
    if (!newName.trim() || !newDomain.trim()) return;
    let domain = newDomain.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
    setAdding(true);
    try {
      const row = await dataAdapter.create('FavoriteStore', { name: newName.trim(), domain, category: newCategory });
      setStores(prev => [...prev, row]);
      setNewName(''); setNewDomain(''); setNewCategory('general'); setShowAdd(false);
      toast({ title: t('gs_store_added') });
    } catch { toast({ title: t('error_occurred') }); }
    setAdding(false);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await dataAdapter.delete('FavoriteStore', id);
      setStores(prev => prev.filter(s => s.id !== id));
    } catch {}
  };

  const selectedArr = stores.filter(s => selectedStores?.has(s.domain));
  const hasSelected = selectedArr.length > 0;

  // Group by category
  const grouped = {};
  for (const s of stores) {
    const cat = s.category || 'general';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  }

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setOpen(v => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent hover:bg-accent/70 transition-colors text-xs font-medium"
        >
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          <Store size={13} /> {t('gs_favorite_stores')}
          {stores.length > 0 && <span className="text-muted-foreground/60">({stores.length})</span>}
        </button>
        {hasSelected && hasResults && (
          <button
            onClick={onSearchInStores}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Search size={12} /> {t('gs_search_in_stores')} ({selectedArr.length})
          </button>
        )}
        {hasSelected && (
          <button
            onClick={() => selectedArr.forEach(s => onToggleStore(s.domain))}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground"
          >
            <X size={12} /> {t('gs_clear')}
          </button>
        )}
      </div>

      {open && (
        <div className="mt-2 rounded-2xl border border-border bg-card p-3 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-3"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>
          ) : stores.length === 0 && !showAdd ? (
            <div className="text-center py-3">
              <p className="text-xs text-muted-foreground mb-2">{t('gs_no_stores')}</p>
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20"
              >
                <Plus size={12} /> {t('gs_add_store')}
              </button>
            </div>
          ) : (
            <>
              {CATEGORIES.filter(c => grouped[c]).map(cat => (
                <div key={cat}>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">{t('gs_category_' + cat)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {grouped[cat].map(s => {
                      const isSelected = selectedStores?.has(s.domain);
                      return (
                        <div
                          key={s.id}
                          onClick={() => onToggleStore(s.domain)}
                          className={`group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-colors cursor-pointer text-xs font-medium ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-accent/60 hover:bg-accent'
                          }`}
                        >
                          <img src={faviconFor(s.domain)} alt="" className="w-4 h-4 rounded shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
                          <span>{s.name}</span>
                          {isSelected && <Check size={11} />}
                          <button
                            onClick={(e) => handleDelete(s.id, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 rounded-full hover:bg-destructive/20 flex items-center justify-center"
                          >
                            <Trash2 size={9} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {showAdd ? (
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex gap-2 flex-wrap">
                    <input
                      type="text"
                      placeholder={t('gs_store_name')}
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="flex-1 min-w-[100px] h-9 px-3 rounded-lg bg-accent/40 border border-border text-xs outline-none"
                    />
                    <input
                      type="text"
                      placeholder="digikala.com"
                      value={newDomain}
                      onChange={e => setNewDomain(e.target.value)}
                      className="flex-1 min-w-[100px] h-9 px-3 rounded-lg bg-accent/40 border border-border text-xs outline-none"
                    />
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      className="h-9 px-2 rounded-lg bg-accent/40 border border-border text-xs outline-none"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{t('gs_category_' + c)}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAdd}
                      disabled={adding || !newName.trim() || !newDomain.trim()}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40"
                    >
                      {adding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                      {t('gs_add_store')}
                    </button>
                    <button
                      onClick={() => { setShowAdd(false); setNewName(''); setNewDomain(''); }}
                      className="px-3 py-1.5 rounded-lg bg-accent text-xs text-muted-foreground"
                    >
                      {t('gs_cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAdd(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent/60 hover:bg-accent text-xs font-medium"
                >
                  <Plus size={12} /> {t('gs_add_store')}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
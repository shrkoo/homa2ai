import React, { useEffect, useState } from 'react';
import { Search, Trash2, Copy, FileText, Image as ImageIcon, Video, File, X, Download, Share2, Compass } from 'lucide-react';
import { dataAdapter } from '@/lib/adapters';
import { useI18n } from '@/i18n/I18nContext';
import PageHeader from '@/components/PageHeader';
import { Image as UIImage } from '@/components/ui/image';
import { toast } from '@/components/ui/use-toast';
import GlobalSearchResults from '@/components/GlobalSearchResults';

const CATS = ['all', 'search', 'text', 'image', 'video', 'document', 'file'];

export default function Library() {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setItems(await dataAdapter.list('LibraryItem','-updated_date', 100)); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((i) => {
    const isSearch = i.provider === 'global_search';
    if (cat === 'search') return isSearch && (!q || (i.title || '').includes(q));
    if (isSearch) return false;
    if (cat === 'all') return (!q || (i.title || '').includes(q));
    return i.kind === cat && (!q || (i.title || '').includes(q));
  });

  const del = async (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selected?.id === id) setSelected(null);
    try { await dataAdapter.delete('LibraryItem', id); } catch { load(); }
  };

  const copy = (item) => {
    navigator.clipboard.writeText(item.content || '');
    toast({ title: t('copied') });
  };

  const share = (item) => {
    if (navigator.share) {
      navigator.share({ title: item.title, text: item.content, url: item.file_url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(item.file_url || item.content || '');
      toast({ title: t('link_copied') });
    }
  };

  const iconFor = (item) => {
    if (item?.provider === 'global_search') return Compass;
    return { image: ImageIcon, video: Video, document: FileText, file: File, text: FileText }[item?.kind] || FileText;
  };

  return (
    <div className="min-h-dvh">
      <PageHeader title={t('library')} />
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="relative mb-3">
          <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search')}
            className="w-full h-10 ps-9 pe-3 rounded-xl bg-accent/60 text-sm outline-none focus:bg-accent"
          />
        </div>
        <div className="flex gap-1.5 mb-4 overflow-x-auto -mx-4 px-4">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 px-3 h-8 rounded-full text-xs font-medium transition-colors ${cat === c ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground hover:text-foreground'}`}
            >
              {c === 'all' ? t('all') : c === 'search' ? t('cat_search') : t('cat_' + c)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-accent/50 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground">{cat === 'search' ? t('gs_no_search_history') : t('no_saved_desc')}</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => {
              const Icon = iconFor(item);
              return (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card text-start hover:bg-accent/40 transition-colors"
                >
                  {item.file_url && item.kind === 'image' ? (
                    <img src={item.file_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon size={20} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{(item.content || '').slice(0, 60)}</p>
                  </div>
                  <span
                    onClick={(e) => { e.stopPropagation(); copy(item); }}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent shrink-0"
                  >
                    <Copy size={15} />
                  </span>
                  <span
                    onClick={(e) => { e.stopPropagation(); del(item.id); }}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-destructive/10 text-destructive shrink-0"
                  >
                    <Trash2 size={15} />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-card rounded-2xl max-w-lg w-full max-h-[85dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-border sticky top-0 bg-card">
              <p className="font-medium text-sm truncate flex-1">{selected.title}</p>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent shrink-0">
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              {selected.kind === 'image' && selected.file_url && (
                <UIImage src={selected.file_url} className="w-full rounded-xl" fittingType="fit" />
              )}
              {selected.kind === 'video' && selected.file_url && (
                <video src={selected.file_url} controls className="w-full rounded-xl" />
              )}
              {selected.provider === 'global_search' && selected.content && (() => {
                const match = selected.content.match(/```global-search\n([\s\S]*?)```/);
                if (match) { try { return <GlobalSearchResults data={JSON.parse(match[1])} />; } catch {} }
                return <p className="text-sm leading-7 whitespace-pre-wrap break-words mt-3">{selected.content}</p>;
              })()}
              {selected.provider !== 'global_search' && selected.content && (
                <p className="text-sm leading-7 whitespace-pre-wrap break-words mt-3">{selected.content}</p>
              )}
            </div>
            <div className="flex gap-2 p-3 border-t border-border sticky bottom-0 bg-card">
              {selected.file_url && (
                <a
                  href={selected.file_url}
                  download
                  className="flex-1 h-10 rounded-xl bg-accent flex items-center justify-center gap-1.5 text-sm font-medium"
                >
                  <Download size={16} /> {t('download')}
                </a>
              )}
              <button
                onClick={() => share(selected)}
                className="flex-1 h-10 rounded-xl bg-accent flex items-center justify-center gap-1.5 text-sm font-medium"
              >
                <Share2 size={16} /> {t('share')}
              </button>
              <button
                onClick={() => copy(selected)}
                className="h-10 px-4 rounded-xl bg-accent flex items-center justify-center gap-1.5 text-sm font-medium"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
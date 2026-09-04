import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Plug, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { dataAdapter } from '@/lib/adapters';
import { getConnectableProviders } from '@/lib/providerRegistry';
import { CATEGORIES, CAPABILITIES } from '@/lib/toolCatalog';
import ConnectorCard from '@/components/connectors/ConnectorCard';

const CATEGORY_ICONS = {
  TEXT: '🧠', CODING: '💻', WEB: '🔎', IMAGE: '🖼️', VIDEO: '🎬',
  VOICE: '🎙️', AUDIO: '🔊', MUSIC: '🎵', FILES: '📄', PRODUCT: '🛒', SOCIAL: '📱',
};

export default function Connectors() {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('ALL');

  const providers = useMemo(() => getConnectableProviders(), []);

  const loadConnections = async () => {
    try {
      const list = await dataAdapter.list('UserConnection','-updated_date', 100);
      setConnections(list || []);
    } catch { setConnections([]); }
    setLoading(false);
  };

  useEffect(() => { loadConnections(); }, []);

  const connectionFor = (providerId) => connections.find((c) => c.tool_id === providerId || c.provider_id === providerId);

  const categoriesWithCount = useMemo(() => {
    const counts = {};
    providers.forEach((p) => { p.capabilities.forEach((c) => { const cat = CAPABILITIES[c]?.category; if (cat) counts[cat] = (counts[cat] || 0) + 1; }); });
    return Object.keys(counts);
  }, [providers]);

  const filtered = useMemo(() => {
    let list = providers;
    if (activeCat !== 'ALL') {
      list = list.filter((p) => p.capabilities.some((c) => CAPABILITIES[c]?.category === activeCat));
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.description?.en || '').toLowerCase().includes(q) || (p.description?.fa || '').includes(query));
    }
    return list;
  }, [providers, activeCat, query]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((p) => {
      const cats = [...new Set(p.capabilities.map((c) => CAPABILITIES[c]?.category).filter(Boolean))];
      cats.forEach((cat) => {
        if (activeCat === 'ALL' || activeCat === cat) {
          if (!map[cat]) map[cat] = [];
          if (!map[cat].find((x) => x.id === p.id)) map[cat].push(p);
        }
      });
    });
    return map;
  }, [filtered, activeCat]);

  const onConnected = () => loadConnections();
  const onToggled = (id, enabled) => setConnections((prev) => prev.map((c) => c.id === id ? { ...c, metadata: enabled ? '' : 'disabled' } : c));
  const onDisconnected = (id) => setConnections((prev) => prev.filter((c) => c.id !== id));

  const connectedCount = connections.filter((c) => c.status === 'active').length;

  return (
    <div className="min-h-dvh pb-6">
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-lg border-b border-border pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2 px-4 h-14">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent transition-colors"><ChevronLeft size={20} className="rtl:rotate-180" /></button>
          <div className="flex-1 text-center">
            <h1 className="font-heading text-base font-semibold">{language === 'fa' ? 'کانکتورها' : language === 'ku' ? 'بەستەرەکان' : 'Connectors'}</h1>
            <p className="text-[10px] text-muted-foreground">{connectedCount} {language === 'fa' ? 'متصل' : 'connected'}</p>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center gap-2 rounded-2xl bg-card border border-border px-3 h-11">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={language === 'fa' ? 'جستجوی کانکتور...' : 'Search connectors...'} className="flex-1 bg-transparent text-sm outline-none min-w-0" />
          {query && <button onClick={() => setQuery('')} className="text-muted-foreground">×</button>}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
          <button onClick={() => setActiveCat('ALL')} className={`px-3 h-8 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${activeCat === 'ALL' ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground'}`}>{language === 'fa' ? 'همه' : 'All'}</button>
          {categoriesWithCount.map((cat) => (
            <button key={cat} onClick={() => setActiveCat(cat)} className={`px-3 h-8 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${activeCat === cat ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground'}`}>
              {CATEGORY_ICONS[cat]} {CATEGORIES[cat]?.label?.[language] || cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Plug size={32} className="text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">{language === 'fa' ? 'کانکتوری پیدا نشد' : 'No connectors found'}</p>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="space-y-2">
              <div className="flex items-center gap-2 px-1 pt-2">
                <span className="text-base">{CATEGORY_ICONS[cat]}</span>
                <h2 className="text-xs font-semibold text-muted-foreground">{CATEGORIES[cat]?.label?.[language] || cat}</h2>
                <span className="text-xs text-muted-foreground/50">({items.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {items.map((p) => (
                  <ConnectorCard key={p.id} provider={p} connection={connectionFor(p.id)} onConnected={onConnected} onToggled={onToggled} onDisconnected={onDisconnected} />
                ))}
              </div>
            </div>
          ))
        )}

        <p className="text-[11px] text-muted-foreground/70 leading-5 text-center px-4 pt-2">
          {language === 'fa'
            ? 'کلیدهای API فقط در Worker رمزنگاری‌شده ذخیره می‌شوند و هرگز در دستگاه شما یا کد عمومی قرار نمی‌گیرند.'
            : 'API keys are encrypted and stored server-side only — never on your device or in public code.'}
        </p>
      </div>
    </div>
  );
}
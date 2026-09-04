import React, { useState } from 'react';
import { Medal, Store, MapPin, ExternalLink, Check, X, Plus, Bell, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { dataAdapter, connectorAdapter } from '@/lib/adapters';
import { toast } from '@/components/ui/use-toast';

function fmtPrice(price, currency) {
  if (!price) return '';
  const num = typeof price === 'number' ? price : parseFloat(String(price).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return String(price);
  return num.toLocaleString('en-US') + (currency ? ' ' + currency : '');
}

function fmtDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return ''; }
}

export default function ProductCard({ product, rank }) {
  const { t, language } = useI18n();
  const isCheapest = rank === 1;
  const inStock = product.in_stock === true || product.in_stock === 'true';
  const outOfStock = product.in_stock === false || product.in_stock === 'false';

  const [showListPicker, setShowListPicker] = useState(false);
  const [lists, setLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [adding, setAdding] = useState(false);

  const [showReminder, setShowReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [settingReminder, setSettingReminder] = useState(false);

  const buildItem = () => ({
    product_name: product.name || '',
    price: String(product.price || ''),
    currency: product.currency || '',
    seller: product.seller || '',
    url: product.url || '',
    image: product.image || '',
    saved_at: new Date().toISOString(),
  });

  const openListPicker = async () => {
    try { setLists(await dataAdapter.list('ShoppingList',)); } catch {}
    setShowListPicker(true);
  };

  const addToExistingList = async (listId) => {
    setAdding(true);
    try {
      const list = lists.find(l => l.id === listId);
      await dataAdapter.update('ShoppingList', listId, { items: [...(list.items || []), buildItem()] });
      toast({ title: t('gs_added_to_list') });
      setShowListPicker(false);
    } catch { toast({ title: t('error_occurred') }); }
    setAdding(false);
  };

  const createNewListWithProduct = async () => {
    if (!newListName.trim()) return;
    setAdding(true);
    try {
      await dataAdapter.create('ShoppingList', { name: newListName.trim(), items: [buildItem()] });
      toast({ title: t('gs_list_created') });
      setShowListPicker(false);
      setNewListName('');
    } catch { toast({ title: t('error_occurred') }); }
    setAdding(false);
  };

  const setReminder = async () => {
    if (!reminderDate) return;
    setSettingReminder(true);
    try {
      const remindAt = new Date(reminderDate).toISOString();
      await dataAdapter.create('PriceReminder', {
        product_name: product.name || '',
        price: String(product.price || ''),
        currency: product.currency || '',
        seller: product.seller || '',
        url: product.url || '',
        remind_at: remindAt,
        status: 'pending',
      });
      try {
        await connectorAdapter.createCalendarEvent({
          content: `بررسی دوباره قیمت ${product.name || ''}\nقیمت فعلی: ${fmtPrice(product.price, product.currency)}\nفروشگاه: ${product.seller || ''}\nلینک: ${product.url || ''}`,
          language,
        });
      } catch {}
      toast({ title: t('gs_reminder_set') });
      setShowReminder(false);
      setReminderDate('');
    } catch { toast({ title: t('error_occurred') }); }
    setSettingReminder(false);
  };

  return (
    <div className={`relative rounded-2xl border bg-card overflow-hidden transition-colors ${isCheapest ? 'border-amber-500/40 shadow-sm' : 'border-border'}`}>
      {isCheapest && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/15 to-amber-500/5 border-b border-amber-500/20">
          <Medal size={14} className="text-amber-500" />
          <span className="text-xs font-bold text-amber-600">{t('gs_cheapest')}</span>
        </div>
      )}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-snug">{product.name || t('gs_no_name')}</p>
            {product.specs && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.specs}</p>}
          </div>
          {rank > 1 && (
            <span className="shrink-0 w-6 h-6 rounded-full bg-accent text-muted-foreground flex items-center justify-center text-xs font-bold tabular-nums">{rank}</span>
          )}
        </div>

        {product.price && (
          <div className="flex items-baseline gap-1.5 mt-2.5">
            <span className={`text-lg font-bold tabular-nums ${isCheapest ? 'text-amber-600' : 'text-foreground'}`}>{fmtPrice(product.price, product.currency)}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
          {product.seller && <span className="inline-flex items-center gap-1"><Store size={11} /> {product.seller}</span>}
          {product.country && <span className="inline-flex items-center gap-1"><MapPin size={11} /> {product.country}</span>}
        </div>

        <div className="flex items-center justify-between gap-2 mt-2.5">
          <div className="flex items-center gap-2">
            {inStock && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium"><Check size={10} /> {t('gs_in_stock')}</span>}
            {outOfStock && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium"><X size={10} /> {t('gs_out_of_stock')}</span>}
            {product.checked_at && <span className="text-xs text-muted-foreground/70">{fmtDate(product.checked_at)}</span>}
          </div>
          {product.url && (
            <a href={product.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors shrink-0">
              {t('gs_view_product')} <ExternalLink size={11} />
            </a>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-border/50">
          <button onClick={openListPicker} className="flex-1 h-7 rounded-full bg-accent text-xs font-medium flex items-center justify-center gap-1 hover:bg-accent/70 transition-colors">
            <Plus size={12} /> {t('gs_add_to_list')}
          </button>
          <button onClick={() => setShowReminder(v => !v)} className="flex-1 h-7 rounded-full bg-accent text-xs font-medium flex items-center justify-center gap-1 hover:bg-accent/70 transition-colors">
            <Bell size={12} /> {t('gs_reminder')}
          </button>
        </div>

        {showListPicker && (
          <div className="mt-2 pt-2 border-t border-border space-y-1.5">
            {lists.length > 0 && (
              <div className="space-y-1">
                {lists.map(l => (
                  <button key={l.id} onClick={() => addToExistingList(l.id)} disabled={adding} className="w-full h-8 px-3 rounded-lg bg-accent text-xs text-start hover:bg-accent/70 transition-colors flex items-center justify-between">
                    <span className="truncate">{l.name}</span>
                    <span className="text-muted-foreground shrink-0">{(l.items || []).length}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-1.5">
              <input type="text" value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder={t('gs_new_list_name')} className="flex-1 h-8 px-3 rounded-lg bg-accent text-xs outline-none" />
              <button onClick={createNewListWithProduct} disabled={adding || !newListName.trim()} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40">
                {adding ? <Loader2 size={12} className="animate-spin" /> : t('gs_create_list')}
              </button>
            </div>
            <button onClick={() => setShowListPicker(false)} className="w-full h-7 text-xs text-muted-foreground">{t('gs_cancel')}</button>
          </div>
        )}

        {showReminder && (
          <div className="mt-2 pt-2 border-t border-border space-y-1.5">
            <input type="datetime-local" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} className="w-full h-8 px-3 rounded-lg bg-accent text-xs outline-none" />
            <div className="flex gap-1.5">
              <button onClick={setReminder} disabled={settingReminder || !reminderDate} className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40">
                {settingReminder ? <Loader2 size={12} className="animate-spin mx-auto" /> : t('gs_reminder_set')}
              </button>
              <button onClick={() => setShowReminder(false)} className="h-8 px-3 rounded-lg bg-accent text-xs">{t('gs_cancel')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
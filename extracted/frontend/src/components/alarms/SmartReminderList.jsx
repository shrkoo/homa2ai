import React, { useState, useEffect } from 'react';
import { Sparkles, DollarSign, Trash2, Check, MoreVertical, TrendingDown, TrendingUp, Package } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { reminders } from '@/lib/alarmStore';
import { toast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

const CONDITION_LABELS = {
  PRICE_BELOW: 'قیمت زیر', PRICE_ABOVE: 'قیمت بالای',
  PRICE_DROP_PERCENT: 'کاهش قیمت %', PRICE_RISE_PERCENT: 'افزایش قیمت %',
  IN_STOCK: 'موجود', BACK_IN_STOCK: 'مجدد موجود', OUT_OF_STOCK: 'ناموجود',
  PRODUCT_AVAILABLE: 'محصول موجود',
};

const CONDITION_ICONS = {
  PRICE_BELOW: TrendingDown, PRICE_ABOVE: TrendingUp,
  PRICE_DROP_PERCENT: TrendingDown, PRICE_RISE_PERCENT: TrendingUp,
  IN_STOCK: Package, BACK_IN_STOCK: Package, OUT_OF_STOCK: Package, PRODUCT_AVAILABLE: Package,
};

export default function SmartReminderList({ refreshKey }) {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const r = await reminders.filter({ reminder_type: { $in: ['smart', 'price_alert'] } }, '-created_date', 100);
      setItems(r);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [refreshKey]);

  const del = async (item) => {
    try { await reminders.delete(item.id); load(); }
    catch { toast({ title: t('error_occurred') }); }
  };

  const complete = async (item) => {
    try { await reminders.update(item.id, { status: 'done' }); load(); }
    catch { toast({ title: t('error_occurred') }); }
  };

  if (loading) return <div className="text-center py-8 text-sm text-muted-foreground">...</div>;
  if (!items.length) return (
    <div className="text-center py-12 text-muted-foreground">
      <Sparkles size={32} className="mx-auto mb-2 opacity-40" />
      <p className="text-sm">{t('no_smart_reminders') || 'یادآور هوشمندی نیست'}</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {items.map((r) => {
        const Icon = CONDITION_ICONS[r.condition_type] || Sparkles;
        const condLabel = CONDITION_LABELS[r.condition_type] || r.condition_type;
        return (
          <div key={r.id} className={`rounded-2xl border p-3.5 ${r.status === 'done' ? 'border-border bg-accent/30 opacity-50' : r.reminder_type === 'price_alert' ? 'border-amber-500/30 bg-amber-500/5' : 'border-violet-500/30 bg-violet-500/5'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${r.reminder_type === 'price_alert' ? 'bg-amber-500/15 text-amber-500' : 'bg-violet-500/15 text-violet-500'}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{r.product_name || r.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {condLabel} {r.condition_value || ''}
                  {r.target_price > 0 && ` — ${r.target_price.toLocaleString('fa-IR')}`}
                </p>
                {r.product_url && <a href={r.product_url} target="_blank" rel="noreferrer" className="text-[10px] text-primary underline truncate block">{r.product_url.slice(0, 40)}</a>}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent"><MoreVertical size={16} /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44 rounded-2xl p-1.5">
                  <DropdownMenuItem onClick={() => complete(r)}><Check size={14} /> {t('complete')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => del(r)} className="text-destructive"><Trash2 size={14} /> {t('delete')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}
    </div>
  );
}
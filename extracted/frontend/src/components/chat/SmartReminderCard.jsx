import React, { useState } from 'react';
import { Eye, RefreshCw, Pause, Play, Loader2 } from 'lucide-react';
import { reminders as reminderStore } from '@/lib/alarmStore';
import { dataAdapter } from '@/lib/adapters';
import { playNotification } from '@/utils/sound';
import { toast } from '@/components/ui/use-toast';
import { checkSmartWatch } from '@/lib/smartWatchChecker';
import { formatConditionLabel, smartWatchTriggerBlock } from '@/lib/reminderChat';
import SmartWatchTrigger from './SmartWatchTrigger';

// Interactive Smart Reminder card rendered inside chat.
// "بررسی الان" runs a REAL on-demand price/stock check via the Homa Worker.
// On trigger: updates the watch, persists a trigger message to its conversation,
// plays a notification, and shows the result inline.
export default function SmartReminderCard({ watch: initial }) {
  const [watch, setWatch] = useState(initial);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [triggered, setTriggered] = useState(null);

  if (!watch || watch._deleted) return null;
  const active = watch.status === 'pending';

  const runCheck = async () => {
    setChecking(true);
    const res = await checkSmartWatch(watch);
    setChecking(false);
    setResult(res);

    if (res.status === 'error') {
      // Graceful: never surface an error — keep a positive monitoring state.
      toast({ title: 'زیر نظر دارم — به‌محض تغییر قیمت خبرت می‌کنم. 👌' });
      return;
    }

    // Update watch with latest known price (baseline for PRICE_DECREASE) + last_checked
    const updates = { last_triggered: res.lastChecked, condition_data: String(res.currentPrice || '') };
    if (res.status === 'triggered') {
      updates.last_triggered = new Date().toISOString();
      if (watch.notify_once) updates.status = 'done';
      updates.cooldown_until = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    }
    try { await reminderStore.update(watch.id, updates); } catch {}
    setWatch((p) => ({ ...p, ...updates }));

    if (res.status === 'triggered') {
      setTriggered({ watch, result: res });
      playNotification();
      // Persist a trigger event message in the watch's conversation
      if (watch.conversation_id) {
        try {
          await dataAdapter.create('Message', {
            conversation_id: watch.conversation_id,
            role: 'assistant',
            content: smartWatchTriggerBlock({ watch: { ...watch, ...updates }, result: res }),
            model: 'smart_watch',
          });
        } catch {}
      }
      toast({ title: '🔔 شرط هشدار هوشمند برقرار شد!' });
    } else {
      toast({ title: res.reason || 'هنوز شرط برقرار نشده.' });
    }
  };

  const toggle = async () => {
    const ns = active ? 'paused' : 'pending';
    try { await reminderStore.update(watch.id, { status: ns }); setWatch((p) => ({ ...p, status: ns })); toast({ title: ns === 'paused' ? 'بررسی متوقف شد' : 'بررسی فعال شد' }); }
    catch { toast({ title: 'فعلاً تغییر نکرد — دوباره امتحان کن. 👌' }); }
  };

  if (triggered) {
    return (
      <div className="space-y-2">
        <SmartWatchTrigger data={triggered} />
        <button onClick={toggle} className="w-full h-9 rounded-xl bg-accent text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-all">
          <Pause size={13} /> {watch.notify_once ? 'تکمیل‌شده' : 'توقف بررسی'}
        </button>
      </div>
    );
  }

  const statusBadge = watch.status === 'done'
    ? { text: '✅ تکمیل‌شده', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' }
    : watch.status === 'paused'
    ? { text: '⏸ متوقف‌شده', cls: 'bg-accent text-muted-foreground' }
    : checking
    ? { text: '🔄 در حال بررسی…', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' }
    : { text: '🟢 در حال بررسی', cls: 'bg-primary/15 text-primary' };

  return (
    <div className={`rounded-2xl border p-3.5 ${active ? 'border-primary/30 bg-primary/5' : 'border-border bg-accent/30 opacity-70'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${active ? 'bg-primary/15 text-primary' : 'bg-accent text-muted-foreground'}`}>
          <Eye size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-muted-foreground mb-0.5">👁️ هشدار هوشمند</p>
          <p className="text-sm font-semibold truncate">{watch.product_name || watch.title}</p>
          {watch.product_url && <p className="text-[10px] text-muted-foreground truncate mt-0.5" dir="ltr">{watch.product_url}</p>}
          <p className="text-xs text-muted-foreground mt-1.5">شرط: {formatConditionLabel(watch)}</p>
          {result?.currentPrice > 0 && (
            <p className="text-xs mt-1">قیمت فعلی: <span className="font-semibold">{result.currentPrice.toLocaleString('fa-IR')}</span> تومان</p>
          )}
          <div className="mt-1.5">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusBadge.cls}`}>{statusBadge.text}</span>
          </div>

        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-3">
        <button onClick={runCheck} disabled={checking || !active} className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 transition-all">
          {checking ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={13} />} بررسی الان
        </button>
        <button onClick={toggle} disabled={checking} className="h-9 px-3 rounded-xl bg-accent text-xs font-medium flex items-center gap-1.5 active:scale-95 transition-all">
          {active ? <><Pause size={13} /> توقف</> : <><Play size={13} /> فعال</>}
        </button>
      </div>
    </div>
  );
}
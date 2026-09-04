import React, { useState } from 'react';
import { Bell, Check, Trash2, Pencil, Pause, Play, Clock, Repeat, X, Loader2 } from 'lucide-react';
import { reminders as reminderStore } from '@/lib/alarmStore';
import { toast } from '@/components/ui/use-toast';

const TAG_COLORS = {
  'خرید': 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  'کاری': 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  'شخصی': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  'عمومی': 'bg-accent text-muted-foreground',
};

const RECUR_LABELS = {
  once: 'یک‌بار', daily: 'روزانه', weekdays: 'روزهای کاری', weekly: 'هفتگی', monthly: 'ماهانه', custom: 'دلخواه',
};

function formatWhen(iso) {
  try {
    return new Date(iso).toLocaleString('fa-IR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso || ''; }
}

function toLocalInput(iso) {
  try {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ''; }
}

// Interactive reminder card rendered inside chat messages.
// The reminder record is passed from the parsed ```reminder-card block.
export default function ReminderCard({ reminder: initial }) {
  const [rem, setRem] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: initial.title || '', remind_at: toLocalInput(initial.remind_at) });
  const [busy, setBusy] = useState(false);

  if (!rem || rem._deleted) return null;
  const active = rem.status === 'pending';

  const toggle = async () => {
    setBusy(true);
    try {
      const ns = active ? 'paused' : 'pending';
      await reminderStore.update(rem.id, { status: ns });
      setRem((p) => ({ ...p, status: ns }));
      toast({ title: ns === 'paused' ? 'یادآور غیرفعال شد' : 'یادآور فعال شد' });
    } catch { toast({ title: 'فعلاً تغییر نکرد — دوباره امتحان کن. 👌' }); }
    setBusy(false);
  };

  const del = async () => {
    setBusy(true);
    try {
      await reminderStore.delete(rem.id);
      setRem((p) => ({ ...p, _deleted: true }));
      toast({ title: 'یادآور حذف شد' });
    } catch { toast({ title: 'فعلاً حذف نشد — دوباره امتحان کن. 👌' }); }
    setBusy(false);
  };

  const saveEdit = async () => {
    if (!form.title.trim() || !form.remind_at) return;
    setBusy(true);
    try {
      const when = new Date(form.remind_at).toISOString();
      await reminderStore.update(rem.id, { title: form.title.trim(), remind_at: when, status: 'pending' });
      setRem((p) => ({ ...p, title: form.title.trim(), remind_at: when, status: 'pending' }));
      setEditing(false);
      toast({ title: 'یادآور به‌روز شد' });
    } catch { toast({ title: 'فعلاً به‌روز نشد — دوباره امتحان کن. 👌' }); }
    setBusy(false);
  };

  return (
    <div className={`rounded-2xl border p-3.5 transition-colors ${active ? 'border-primary/30 bg-primary/5' : 'border-border bg-accent/30 opacity-60'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${active ? 'bg-primary/15 text-primary' : 'bg-accent text-muted-foreground'}`}>
          <Bell size={18} />
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="w-full h-9 px-2.5 rounded-lg bg-background outline-none text-sm" />
              <input type="datetime-local" value={form.remind_at} onChange={(e) => setForm((p) => ({ ...p, remind_at: e.target.value }))} className="w-full h-9 px-2.5 rounded-lg bg-background outline-none text-sm" />
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold truncate">{rem.title}</p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Clock size={11} /> {formatWhen(rem.remind_at)}</span>
                {rem.recurring_type && rem.recurring_type !== 'once' && (
                  <span className="flex items-center gap-1"><Repeat size={11} /> {RECUR_LABELS[rem.recurring_type] || rem.recurring_type}</span>
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${active ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-accent text-muted-foreground'}`}>
                  {active ? '● فعال' : '○ غیرفعال'}
                </span>
                {rem.label && (
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TAG_COLORS[rem.label] || TAG_COLORS['عمومی']}`}>{rem.label}</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-3">
        {editing ? (
          <>
            <button onClick={saveEdit} disabled={busy} className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 transition-all">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} ذخیره
            </button>
            <button onClick={() => setEditing(false)} className="h-9 px-3 rounded-xl bg-accent text-xs font-medium flex items-center gap-1.5"><X size={14} /> لغو</button>
          </>
        ) : (
          <>
            <button onClick={toggle} disabled={busy} className="flex-1 h-9 rounded-xl bg-accent text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-all">
              {active ? <><Pause size={13} /> غیرفعال</> : <><Play size={13} /> فعال</>}
            </button>
            <button onClick={() => setEditing(true)} className="h-9 px-3 rounded-xl bg-accent text-xs font-medium flex items-center gap-1.5 active:scale-95 transition-all"><Pencil size={13} /> ویرایش</button>
            <button onClick={del} disabled={busy} className="h-9 px-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-1.5 active:scale-95 transition-all"><Trash2 size={13} /> حذف</button>
          </>
        )}
      </div>
    </div>
  );
}
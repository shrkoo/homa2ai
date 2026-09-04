import React, { useState, useEffect } from 'react';
import { ListTodo, Check, X, Loader2 } from 'lucide-react';
import { reminders as reminderStore } from '@/lib/alarmStore';
import { toast } from '@/components/ui/use-toast';

const TAG_COLORS = {
  'خرید': 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  'کاری': 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  'شخصی': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  'عمومی': 'bg-accent text-muted-foreground',
};

function isToday(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

// Floating button + sheet showing today's pending reminders, with one-tap check-off.
// Lives next to the chat so the user never leaves the page.
export default function TodayRemindersSheet() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const all = await reminderStore.filter({ status: 'pending' }, 'remind_at', 100);
      setItems(all.filter((r) => isToday(r.remind_at)));
    } catch {}
    setLoading(false);
  };

  // Load once on mount so the badge count is accurate without opening.
  useEffect(() => { load(); }, []);

  const check = async (id) => {
    setBusyId(id);
    try {
      await reminderStore.update(id, { status: 'done' });
      setItems((p) => p.filter((r) => r.id !== id));
      toast({ title: 'انجام شد ✓' });
    } catch {
      toast({ title: 'فعلاً ثبت نشد — دوباره امتحان کن. 👌' });
    }
    setBusyId(null);
  };

  return (
    <>
      <button
        onClick={() => { setOpen(true); load(); }}
        className="fixed bottom-24 left-4 z-30 w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        aria-label="یادآورهای امروز"
      >
        <ListTodo size={20} />
        {items.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{items.length}</span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-end justify-center animate-in fade-in" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-t-3xl border-t border-border bg-card p-3 pb-6 shadow-2xl animate-in slide-in-from-bottom max-h-[70dvh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-3" />
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-heading text-base font-semibold flex items-center gap-2"><ListTodo size={18} /> یادآورهای امروز</h3>
              <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-2 px-0.5">
              {loading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
              ) : items.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-10">امروز هیچ یادآوری نداری 🎉</p>
              ) : (
                items.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-background">
                    <button
                      onClick={() => check(r.id)}
                      disabled={busyId === r.id}
                      className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center shrink-0 active:scale-90 transition-transform hover:border-primary hover:text-primary disabled:opacity-50"
                    >
                      {busyId === r.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} className="opacity-0 hover:opacity-100" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">{new Date(r.remind_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                        {r.label && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${TAG_COLORS[r.label] || TAG_COLORS['عمومی']}`}>{r.label}</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
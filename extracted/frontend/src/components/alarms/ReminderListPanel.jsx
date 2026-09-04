import React, { useState, useEffect } from 'react';
import { Bell, MoreVertical, Pencil, Pause, Play, Trash2, Check, X } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { reminders } from '@/lib/alarmStore';
import { toast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { syncReminderToGCal } from '@/utils/gcalSync';

function toLocalInput(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ReminderListPanel({ onEdit, refreshKey }) {
  const { t, language } = useI18n();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const load = async () => {
    try {
      const r = await reminders.filter({ reminder_type: 'time' }, 'remind_at', 100);
      setReminders(r);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [refreshKey]);

  const toggle = async (rem) => {
    try {
      const newStatus = rem.status === 'paused' ? 'pending' : 'paused';
      await reminders.update(rem.id, { status: newStatus });
      load();
    } catch { toast({ title: t('error_occurred') }); }
  };

  const complete = async (rem) => {
    try { await reminders.update(rem.id, { status: 'done' }); load(); }
    catch { toast({ title: t('error_occurred') }); }
  };

  const del = async (rem) => {
    try { await reminders.delete(rem.id); load(); }
    catch { toast({ title: t('error_occurred') }); }
  };

  const startEdit = (rem) => {
    setEditingId(rem.id);
    setEditForm({ title: rem.title || '', remind_at: toLocalInput(rem.remind_at), reason: rem.reason || '' });
  };

  const saveEdit = async (rem) => {
    if (!editForm.title.trim() || !editForm.remind_at) { toast({ title: t('error_occurred') }); return; }
    try {
      const when = new Date(editForm.remind_at).toISOString();
      await reminders.update(rem.id, { title: editForm.title.trim(), remind_at: when, reason: editForm.reason });
      await syncReminderToGCal({ ...rem, title: editForm.title.trim(), remind_at: when });
      toast({ title: t('save') });
      setEditingId(null); setEditForm(null); load();
    } catch { toast({ title: t('error_occurred') }); }
  };

  if (loading) return <div className="text-center py-8 text-sm text-muted-foreground">...</div>;
  if (!reminders.length) return (
    <div className="text-center py-12 text-muted-foreground">
      <Bell size={32} className="mx-auto mb-2 opacity-40" />
      <p className="text-sm">{t('no_reminders') || 'یادآوری نیست'}</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {reminders.map((r) => {
        const dt = new Date(r.remind_at);
        const overdue = dt < new Date() && r.status === 'pending';
        if (editingId === r.id && editForm) {
          return (
            <div key={r.id} className="rounded-2xl border border-primary/40 bg-card p-3.5 space-y-2.5">
              <input value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} className="w-full h-10 px-3 rounded-xl bg-accent outline-none text-sm font-medium" />
              <input type="datetime-local" value={editForm.remind_at} onChange={(e) => setEditForm((p) => ({ ...p, remind_at: e.target.value }))} className="w-full h-11 px-3 rounded-xl bg-accent outline-none text-sm" />
              <input value={editForm.reason} onChange={(e) => setEditForm((p) => ({ ...p, reason: e.target.value }))} placeholder={t('reason') || 'دلیل'} className="w-full h-10 px-3 rounded-xl bg-accent outline-none text-sm" />
              <div className="flex gap-2">
                <button onClick={() => saveEdit(r)} className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-1.5"><Check size={16} /> {t('save')}</button>
                <button onClick={() => { setEditingId(null); setEditForm(null); }} className="flex-1 h-10 rounded-xl bg-accent font-medium flex items-center justify-center gap-1.5"><X size={16} /> {t('cancel') || 'لغو'}</button>
              </div>
            </div>
          );
        }
        return (
          <div key={r.id} className={`rounded-2xl border p-3.5 ${r.status === 'done' ? 'border-border bg-accent/30 opacity-50' : overdue ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-card'}`}>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center w-14 shrink-0">
                <span className="text-lg font-bold tabular-nums">{dt.toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-[10px] text-muted-foreground">{dt.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{r.title}</p>
                {r.reason && <p className="text-xs text-muted-foreground truncate">{r.reason}</p>}
                <div className="flex items-center gap-1.5 mt-1">
                  {r.voice_enabled && <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">🔊</span>}
                  {r.status === 'paused' && <span className="text-[10px] bg-accent text-muted-foreground px-1.5 py-0.5 rounded-full">{t('paused') || 'متوقف'}</span>}
                  {r.status === 'done' && <span className="text-[10px] bg-emerald-500/15 text-emerald-500 px-1.5 py-0.5 rounded-full">{t('done') || 'انجام شد'}</span>}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent"><MoreVertical size={16} /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44 rounded-2xl p-1.5">
                  <DropdownMenuItem onClick={() => startEdit(r)}><Pencil size={14} /> {t('quick_edit') || 'ویرایش سریع'}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => complete(r)}><Check size={14} /> {t('complete') || 'انجام شد'}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggle(r)}>{r.status === 'paused' ? <><Play size={14} /> {t('resume')}</> : <><Pause size={14} /> {t('pause')}</>}</DropdownMenuItem>
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
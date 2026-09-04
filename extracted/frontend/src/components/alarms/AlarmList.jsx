import React, { useState, useEffect } from 'react';
import { Bell, MoreVertical, Pencil, Pause, Play, Trash2, FlaskConical, Volume2, Check, X, SlidersHorizontal } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { alarms } from '@/lib/alarmStore';
import { toast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';


const RECURRING_LABELS = {
  once: 'یک‌بار', daily: 'هر روز', weekdays: 'شنبه-پنجشنبه', custom: 'روزهای انتخابی', weekly: 'هر هفته', biweekly: 'دوهفته', monthly: 'هر ماه',
};

export default function AlarmList({ onEdit, refreshKey }) {
  const { t } = useI18n();
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const load = async () => {
    try {
      const a = await alarms.list('-created_date', 100);
      setAlarms(a);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [refreshKey]);

  const toggleActive = async (alarm) => {
    try {
      await alarms.update(alarm.id, { active: !alarm.active });
      load();
    } catch { toast({ title: t('error_occurred') }); }
  };

  const del = async (alarm) => {
    try {
      await alarms.delete(alarm.id);
      load();
    } catch { toast({ title: t('error_occurred') }); }
  };

  const test = (alarm) => {
    // Trigger the real full-screen overlay (sound + voice + actions) via the engine
    window.dispatchEvent(new CustomEvent('homa-test-alarm', { detail: { alarm } }));
  };

  const startEdit = (alarm) => {
    setEditingId(alarm.id);
    setEditForm({ title: alarm.title || '', hour: alarm.hour ?? 7, minute: alarm.minute ?? 0, reason: alarm.reason || '', description: alarm.description || '' });
  };

  const saveEdit = async (alarm) => {
    if (!editForm.title.trim()) { toast({ title: t('error_occurred') }); return; }
    try {
      const now = new Date();
      const target = new Date(now);
      target.setHours(editForm.hour, editForm.minute, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      await alarms.update(alarm.id, { ...editForm, next_trigger: target.toISOString() });
      toast({ title: t('save') });
      setEditingId(null); setEditForm(null); load();
    } catch { toast({ title: t('error_occurred') }); }
  };

  if (loading) return <div className="text-center py-8 text-sm text-muted-foreground">...</div>;
  if (!alarms.length) return (
    <div className="text-center py-12 text-muted-foreground">
      <Bell size={32} className="mx-auto mb-2 opacity-40" />
      <p className="text-sm">{t('no_alarms') || 'آلارمی نیست'}</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {alarms.map((a) => {
        if (editingId === a.id && editForm) {
          return (
            <div key={a.id} className="rounded-2xl border border-primary/40 bg-card p-3.5 space-y-2.5">
              <input value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} className="w-full h-10 px-3 rounded-xl bg-accent outline-none text-sm font-medium" />
              <div className="flex items-center gap-2">
                <select value={editForm.hour} onChange={(e) => setEditForm((p) => ({ ...p, hour: Number(e.target.value) }))} className="h-12 w-20 rounded-xl bg-accent text-center text-xl font-bold outline-none">
                  {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}</option>)}
                </select>
                <span className="text-xl font-bold">:</span>
                <select value={editForm.minute} onChange={(e) => setEditForm((p) => ({ ...p, minute: Number(e.target.value) }))} className="h-12 w-20 rounded-xl bg-accent text-center text-xl font-bold outline-none">
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                </select>
              </div>
              <input value={editForm.reason} onChange={(e) => setEditForm((p) => ({ ...p, reason: e.target.value }))} placeholder={t('reason') || 'دلیل'} className="w-full h-10 px-3 rounded-xl bg-accent outline-none text-sm" />
              <input value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} placeholder={t('description') || 'توضیح'} className="w-full h-10 px-3 rounded-xl bg-accent outline-none text-sm" />
              <div className="flex gap-2">
                <button onClick={() => saveEdit(a)} className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-1.5"><Check size={16} /> {t('save')}</button>
                <button onClick={() => { setEditingId(null); setEditForm(null); }} className="flex-1 h-10 rounded-xl bg-accent font-medium flex items-center justify-center gap-1.5"><X size={16} /> {t('cancel') || 'لغو'}</button>
              </div>
            </div>
          );
        }
        return (
          <div key={a.id} className={`rounded-2xl border p-3.5 ${a.active ? 'border-border bg-card' : 'border-border bg-accent/50 opacity-60'}`}>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold tabular-nums">{String(a.hour).padStart(2, '0')}:{String(a.minute).padStart(2, '0')}:{String(a.second || 0).padStart(2, '0')}</span>
                <span className="text-[10px] text-muted-foreground">{RECURRING_LABELS[a.recurring_type] || 'یک‌بار'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{a.title}</p>
                {a.reason && <p className="text-xs text-muted-foreground truncate">{a.reason}</p>}
                <div className="flex items-center gap-1.5 mt-1">
                  {a.voice_enabled && <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Volume2 size={10} /> {t('voice') || 'صدا'}</span>}
                  {a.wake_up_mode && <span className="text-[10px] bg-amber-500/15 text-amber-500 px-1.5 py-0.5 rounded-full">🌅</span>}
                  {a.snooze_enabled && <span className="text-[10px] bg-accent text-muted-foreground px-1.5 py-0.5 rounded-full">Snooze {a.snooze_duration}'</span>}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent"><MoreVertical size={16} /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44 rounded-2xl p-1.5">
                  <DropdownMenuItem onClick={() => startEdit(a)}><Pencil size={14} /> {t('quick_edit') || 'ویرایش سریع'}</DropdownMenuItem>
                  {onEdit && <DropdownMenuItem onClick={() => onEdit(a)}><SlidersHorizontal size={14} /> {t('full_edit') || 'ویرایش کامل'}</DropdownMenuItem>}
                  <DropdownMenuItem onClick={() => test(a)}><FlaskConical size={14} /> {t('test_alarm') || 'تست'}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleActive(a)}>{a.active ? <><Pause size={14} /> {t('pause') || 'توقف'}</> : <><Play size={14} /> {t('resume') || 'فعال'}</>}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => del(a)} className="text-destructive"><Trash2 size={14} /> {t('delete')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}
    </div>
  );
}
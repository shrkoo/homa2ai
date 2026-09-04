import React, { useEffect, useState } from 'react';
import { Plus, Loader2, Check, Trash2 } from 'lucide-react';
import { dataAdapter } from '@/lib/adapters';
import { useI18n } from '@/i18n/I18nContext';
import PageHeader from '@/components/PageHeader';
import { toast } from '@/components/ui/use-toast';

export default function Tasks() {
  const { t } = useI18n();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setTasks(await dataAdapter.list('Task','-created_date', 200)); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      const tk = await dataAdapter.create('Task', { title: title.trim() });
      setTasks((p) => [tk, ...p]);
      setTitle('');
    } catch { toast({ title: t('error_occurred') }); }
    setBusy(false);
  };

  const toggle = async (tk) => {
    try {
      await dataAdapter.update('Task', tk.id, { done: !tk.done });
      setTasks((p) => p.map((x) => (x.id === tk.id ? { ...x, done: !x.done } : x)));
    } catch {}
  };

  const remove = async (tk) => {
    try {
      await dataAdapter.delete('Task', tk.id);
      setTasks((p) => p.filter((x) => x.id !== tk.id));
    } catch {}
  };

  const visible = tab === 'active' ? tasks.filter((x) => !x.done) : tasks.filter((x) => x.done);

  return (
    <div className="min-h-dvh">
      <PageHeader title={t('tasks')} />
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <div className="flex gap-1.5">
          {[['active', t('active')], ['completed', t('completed')]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-4 h-9 rounded-full text-sm font-medium ${tab === k ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground'}`}>{label}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder={t('add_task')} className="flex-1 h-11 px-4 rounded-2xl border border-border bg-card text-[15px] outline-none focus:border-primary" />
          <button onClick={add} disabled={busy || !title.trim()} className="w-11 h-11 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40">{busy ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}</button>
        </div>
        {loading ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-xl bg-accent/50 animate-pulse" />)}</div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16"><p className="text-sm text-muted-foreground">{t('no_tasks')}</p></div>
        ) : (
          <div className="space-y-2">
            {visible.map((tk) => (
              <div key={tk.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                <button onClick={() => toggle(tk)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${tk.done ? 'bg-primary border-primary text-primary-foreground' : 'border-border'}`}>
                  {tk.done ? <Check size={14} /> : null}
                </button>
                <p className={`flex-1 text-sm ${tk.done ? 'line-through text-muted-foreground' : ''}`}>{tk.title}</p>
                <button onClick={() => remove(tk)} className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
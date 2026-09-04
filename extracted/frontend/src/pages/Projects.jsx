import React, { useEffect, useState } from 'react';
import { Plus, Loader2, Folder, Trash2, Pencil, Archive } from 'lucide-react';
import { dataAdapter } from '@/lib/adapters';
import { useI18n } from '@/i18n/I18nContext';
import PageHeader from '@/components/PageHeader';
import { toast } from '@/components/ui/use-toast';

const COLORS = ['217 91% 60%', '160 60% 45%', '12 76% 61%', '280 65% 60%', '43 74% 66%'];

export default function Projects() {
  const { t } = useI18n();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setProjects(await dataAdapter.list('Project','-created_date', 100)); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const p = await dataAdapter.create('Project', { name: name.trim(), color: COLORS[Math.floor(Math.random() * COLORS.length)] });
      setProjects((prev) => [p, ...prev]);
      setName('');
    } catch { toast({ title: t('error_occurred') }); }
    setBusy(false);
  };

  const rename = async (p) => {
    const newName = prompt(t('rename'), p.name);
    if (!newName || newName === p.name) return;
    try {
      const updated = await dataAdapter.update('Project', p.id, { name: newName });
      setProjects((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
    } catch {}
  };

  const archive = async (p) => {
    try {
      const updated = await dataAdapter.update('Project', p.id, { archived: !p.archived });
      setProjects((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
    } catch {}
  };

  const remove = async (p) => {
    if (!confirm(t('delete_chat_confirm'))) return;
    try {
      await dataAdapter.delete('Project', p.id);
      setProjects((prev) => prev.filter((x) => x.id !== p.id));
    } catch {}
  };

  const visible = projects.filter((p) => !p.archived);

  return (
    <div className="min-h-dvh">
      <PageHeader title={t('projects')} />
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <div className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} placeholder={t('new_project')} className="flex-1 h-11 px-4 rounded-2xl border border-border bg-card text-[15px] outline-none focus:border-primary" />
          <button onClick={create} disabled={busy || !name.trim()} className="w-11 h-11 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40">{busy ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}</button>
        </div>
        {loading ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-accent/50 animate-pulse" />)}</div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16"><Folder size={28} className="mx-auto text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">{t('no_projects')}</p></div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {visible.map((p) => (
              <div key={p.id} className="p-3 rounded-2xl border border-border bg-card">
                <div className="w-9 h-9 rounded-xl mb-2" style={{ background: `hsl(${p.color || COLORS[0]})` }} />
                <p className="font-medium text-sm truncate">{p.name}</p>
                <div className="flex gap-1 mt-2">
                  <button onClick={() => rename(p)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent"><Pencil size={13} /></button>
                  <button onClick={() => archive(p)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent"><Archive size={13} /></button>
                  <button onClick={() => remove(p)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
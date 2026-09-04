import React, { useEffect, useState } from 'react';
import { Plus, ArrowLeft, Send, Loader2, MessageSquare, LifeBuoy } from 'lucide-react';
import { dataAdapter, supportAdapter } from '@/lib/adapters';
import { useI18n } from '@/i18n/I18nContext';
import PageHeader from '@/components/PageHeader';
import { toast } from '@/components/ui/use-toast';

const STATUS_STYLE = {
  open: 'bg-blue-500/10 text-blue-500',
  in_progress: 'bg-amber-500/10 text-amber-500',
  resolved: 'bg-emerald-500/10 text-emerald-500',
  closed: 'bg-muted text-muted-foreground'
};

const fmtDate = (d) => {
  try { return new Date(d).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' }); } catch { return ''; }
};

export default function Support() {
  const { t } = useI18n();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setTickets(await dataAdapter.list('SupportTicket','-created_date', 100)); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openTicket = async (id) => {
    try {
      const tk = await dataAdapter.get('SupportTicket', id);
      setSelected(tk);
      setView('detail');
    } catch {}
  };

  const create = async () => {
    if (!subject.trim() || !message.trim() || busy) return;
    setBusy(true);
    try {
      const res = await supportAdapter.createTicket({ subject: subject.trim(), message: message.trim() });
      const data = res?.data || res;
      if (data.error) { toast({ title: t('error_occurred') }); }
      else {
        toast({ title: t('ticket_sent') });
        setSubject(''); setMessage('');
        await load();
        openTicket(data.ticket.id);
      }
    } catch { toast({ title: t('error_occurred') }); }
    setBusy(false);
  };

  const sendReply = async () => {
    if (!reply.trim() || !selected || busy) return;
    setBusy(true);
    try {
      const res = await supportAdapter.replyTicket({ ticket_id: selected.id, content: reply.trim() });
      const data = res?.data || res;
      if (!data.error) {
        setReply('');
        const tk = await dataAdapter.get('SupportTicket', selected.id);
        setSelected(tk);
        toast({ title: t('reply_sent') });
      } else { toast({ title: t('error_occurred') }); }
    } catch { toast({ title: t('error_occurred') }); }
    setBusy(false);
  };

  const statusLabel = (s) => ({ open: t('status_open'), in_progress: t('status_in_progress'), resolved: t('status_resolved'), closed: t('status_closed') }[s] || s);

  if (view === 'new') {
    return (
      <div className="min-h-dvh">
        <PageHeader title={t('new_ticket')} action={<button onClick={() => setView('list')} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent"><ArrowLeft size={18} className="rtl:rotate-180" /></button>} />
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t('subject')} className="w-full h-11 px-4 rounded-2xl border border-border bg-card text-[15px] outline-none focus:border-primary" />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('your_message')} rows={6} className="w-full resize-none rounded-2xl border border-border bg-card p-3 text-[15px] outline-none focus:border-primary" />
          <button onClick={create} disabled={busy || !subject.trim() || !message.trim()} className="w-full h-11 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} />} {t('send_message')}
          </button>
        </div>
      </div>
    );
  }

  if (view === 'detail' && selected) {
    const reps = selected.replies || [];
    return (
      <div className="min-h-dvh flex flex-col">
        <PageHeader title={selected.subject} action={<button onClick={() => { setView('list'); setSelected(null); }} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent"><ArrowLeft size={18} className="rtl:rotate-180" /></button>} />
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 h-6 rounded-full text-xs font-medium ${STATUS_STYLE[selected.status]}`}>{statusLabel(selected.status)}</span>
              <span className="text-xs text-muted-foreground">{fmtDate(selected.created_date)}</span>
            </div>
            {reps.map((r, i) => (
              <div key={i} className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-7 ${r.by_admin ? 'bg-primary/10 text-foreground rounded-ss-2xl rounded-se-2xl' : 'bg-accent text-foreground ms-auto rounded-se-2xl rounded-ss-2xl'}`}>
                <p className="text-[11px] font-semibold mb-0.5 text-muted-foreground">{r.by_admin ? t('admin_label') : t('you')}</p>
                <p className="whitespace-pre-wrap break-words">{r.content}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{fmtDate(r.created_at)}</p>
              </div>
            ))}
            {selected.status === 'closed' && <p className="text-xs text-muted-foreground text-center py-2">{t('ticket_closed_msg')}</p>}
          </div>
        </div>
        {selected.status !== 'closed' && (
          <div className="border-t border-border bg-background px-3 py-2.5 pb-[calc(env(safe-area-inset-bottom)+0.625rem)]">
            <div className="max-w-2xl mx-auto flex items-end gap-2">
              <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t('reply_placeholder')} rows={1} className="flex-1 resize-none rounded-2xl border border-border bg-card px-3 py-2.5 text-[15px] outline-none focus:border-primary max-h-32" />
              <button onClick={sendReply} disabled={busy || !reply.trim()} className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-30">
                {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <PageHeader title={t('support')} action={<button onClick={() => setView('new')} className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground"><Plus size={18} /></button>} />
      <div className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-accent/50 animate-pulse" />)}</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16">
            <LifeBuoy size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">{t('no_tickets')}</p>
            <button onClick={() => setView('new')} className="mt-4 px-4 h-10 rounded-full bg-primary text-primary-foreground text-sm font-medium">{t('new_ticket')}</button>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map((tk) => (
              <button key={tk.id} onClick={() => openTicket(tk.id)} className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card text-start hover:bg-accent/40 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0"><MessageSquare size={17} /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{tk.subject}</p>
                  <p className="text-xs text-muted-foreground truncate">{(tk.message || '').slice(0, 60)}</p>
                </div>
                <span className={`px-2 h-5 rounded-full text-[10px] font-medium flex items-center shrink-0 ${STATUS_STYLE[tk.status]}`}>{statusLabel(tk.status)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
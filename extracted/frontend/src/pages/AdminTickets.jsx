import React, { useEffect, useState } from 'react';
import { ArrowLeft, Send, Loader2, Shield, MessageSquare } from 'lucide-react';
import { supportAdapter } from '@/lib/adapters';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import PageHeader from '@/components/PageHeader';
import { toast } from '@/components/ui/use-toast';

const STATUS_STYLE = {
  open: 'bg-blue-500/10 text-blue-500',
  in_progress: 'bg-amber-500/10 text-amber-500',
  resolved: 'bg-emerald-500/10 text-emerald-500',
  closed: 'bg-muted text-muted-foreground'
};
const STATUSES = ['all', 'open', 'in_progress', 'resolved', 'closed'];

const fmtDate = (d) => {
  try { return new Date(d).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' }); } catch { return ''; }
};

export default function AdminTickets() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async (f) => {
    setLoading(true);
    try {
      const res = await supportAdapter.adminListTickets({ status: f || filter });
      const data = res?.data || res;
      if (data.tickets) setTickets(data.tickets);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { if (user?.role === 'admin') load('all'); }, [user]);

  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center text-center px-6">
        <Shield size={32} className="text-muted-foreground mb-3" />
        <p className="font-medium">{t('access_denied')}</p>
        <p className="text-sm text-muted-foreground mt-1">{t('admin_only_desc')}</p>
      </div>
    );
  }

  const statusLabel = (s) => ({ open: t('status_open'), in_progress: t('status_in_progress'), resolved: t('status_resolved'), closed: t('status_closed'), all: t('all_statuses') }[s] || s);

  const changeStatus = async (status) => {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await supportAdapter.adminUpdateTicket({ ticket_id: selected.id, status });
      setSelected((prev) => ({ ...prev, status }));
      setTickets((prev) => prev.map((x) => (x.id === selected.id ? { ...x, status } : x)));
      toast({ title: t('changes_saved') });
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
        const tk = tickets.find((x) => x.id === selected.id);
        const updated = { ...tk, status: 'in_progress', replies: [...(tk.replies || []), data.reply] };
        setSelected(updated);
        setTickets((prev) => prev.map((x) => (x.id === selected.id ? updated : x)));
        toast({ title: t('reply_sent') });
      } else { toast({ title: t('error_occurred') }); }
    } catch { toast({ title: t('error_occurred') }); }
    setBusy(false);
  };

  if (selected) {
    const reps = selected.replies || [];
    return (
      <div className="min-h-dvh flex flex-col">
        <PageHeader title={selected.subject} action={<button onClick={() => setSelected(null)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent"><ArrowLeft size={18} className="rtl:rotate-180" /></button>} />
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 h-6 rounded-full text-xs font-medium ${STATUS_STYLE[selected.status]}`}>{statusLabel(selected.status)}</span>
              <span className="text-xs text-muted-foreground">{selected.user_name} · {selected.user_email}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['in_progress', 'resolved', 'closed'].map((s) => (
                <button key={s} onClick={() => changeStatus(s)} className="px-3 h-8 rounded-full text-xs font-medium border border-border hover:bg-accent">{statusLabel(s)}</button>
              ))}
            </div>
            {reps.map((r, i) => (
              <div key={i} className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-7 ${r.by_admin ? 'bg-primary/10 rounded-ss-2xl rounded-se-2xl' : 'bg-accent ms-auto rounded-se-2xl rounded-ss-2xl'}`}>
                <p className="text-[11px] font-semibold mb-0.5 text-muted-foreground">{r.by_admin ? t('admin_label') : t('ticket_user')}</p>
                <p className="whitespace-pre-wrap break-words">{r.content}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{fmtDate(r.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-border bg-background px-3 py-2.5 pb-[calc(env(safe-area-inset-bottom)+0.625rem)]">
          <div className="max-w-2xl mx-auto flex items-end gap-2">
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t('reply_placeholder')} rows={1} className="flex-1 resize-none rounded-2xl border border-border bg-card px-3 py-2.5 text-[15px] outline-none focus:border-primary max-h-32" />
            <button onClick={sendReply} disabled={busy || !reply.trim()} className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-30">
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <PageHeader title={t('admin_tickets')} />
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex gap-1.5 mb-4 overflow-x-auto -mx-4 px-4">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => { setFilter(s); load(s); }} className={`shrink-0 px-3 h-8 rounded-full text-xs font-medium ${filter === s ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground'}`}>{statusLabel(s)}</button>
          ))}
        </div>
        {loading ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-accent/50 animate-pulse" />)}</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">{t('no_tickets')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map((tk) => (
              <button key={tk.id} onClick={() => setSelected(tk)} className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card text-start hover:bg-accent/40 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0"><MessageSquare size={17} /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{tk.subject}</p>
                  <p className="text-xs text-muted-foreground truncate">{tk.user_name} · {tk.user_email}</p>
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
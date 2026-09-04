import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { dataAdapter } from '@/lib/adapters';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/PageHeader';
import { toast } from '@/components/ui/use-toast';

export default function BugReport() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || loading) return;
    setLoading(true);
    try {
      await dataAdapter.create('SupportTicket', { subject: subject.trim(), message: message.trim(), user_email: user?.email, user_name: user?.full_name, priority: 'normal' });
      toast({ title: t('bug_sent') });
      setSubject(''); setMessage('');
    } catch { toast({ title: t('error_occurred') }); }
    setLoading(false);
  };

  return (
    <div className="min-h-dvh">
      <PageHeader title={t('report_bug')} />
      <div className="max-w-2xl mx-auto px-4 py-4">
        <p className="text-sm text-muted-foreground mb-4">{t('bug_report_desc')}</p>
        <form onSubmit={submit} className="space-y-3">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t('subject')} className="w-full h-11 px-4 rounded-2xl border border-border bg-card text-[15px] outline-none focus:border-primary" required />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('your_message')} rows={6} className="w-full p-3 rounded-2xl border border-border bg-card text-[15px] outline-none focus:border-primary resize-none" required />
          <button type="submit" disabled={loading} className="w-full h-11 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-40">{loading ? <><Loader2 size={18} className="animate-spin" /> {t('loading')}</> : t('send_message')}</button>
        </form>
      </div>
    </div>
  );
}
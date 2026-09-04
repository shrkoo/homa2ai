import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, Loader2 } from 'lucide-react';
import { reminders as reminderStore } from '@/lib/alarmStore';
import { dataAdapter } from '@/lib/adapters';
import { toast } from '@/components/ui/use-toast';
import { buildWeeklySummary } from '@/lib/reminderChat';

// Button for Settings: builds a weekly reminder summary and writes it as a chat message.
export default function WeeklySummaryButton() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      // Iran week: Saturday → Friday
      const now = new Date();
      const day = now.getDay(); // 0=Sun..6=Sat
      const satOffset = (day + 1) % 7; // days since Saturday
      const start = new Date(now);
      start.setDate(now.getDate() - satOffset);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const all = await reminderStore.filter({}, '-created_date', 200);
      const week = all.filter((r) => {
        const d = new Date(r.remind_at || r.created_date);
        return d >= start && d <= end;
      });
      const summary = buildWeeklySummary(week, { start, end });

      const conv = await dataAdapter.create('Conversation', { title: 'خلاصه یادآورهای هفته', language: 'fa' });
      await dataAdapter.create('Message', { conversation_id: conv.id, role: 'assistant', content: summary, model: 'reminder_summary' });
      navigate('/chat/' + conv.id);
    } catch {
      toast({ title: 'خطا در ساخت خلاصه' });
    }
    setBusy(false);
  };

  return (
    <button onClick={run} disabled={busy} className="w-full flex items-center gap-2 h-11 px-3 rounded-xl bg-accent text-sm font-medium hover:bg-accent/70 transition-colors disabled:opacity-50">
      {busy ? <Loader2 size={16} className="animate-spin" /> : <CalendarCheck size={16} />}
      خلاصه یادآورهای هفته
    </button>
  );
}
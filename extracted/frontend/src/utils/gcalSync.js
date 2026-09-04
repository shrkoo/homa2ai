// Google Calendar auto-sync helper.
// Syncs reminders and heavy AI jobs to the user's Google Calendar via the
// createCalendarEvent backend function (Google Calendar connector).
// Activates only when the "homa_gcal_sync" pref is enabled.
// NOTE: requires Integration credits (backend function) — blocked while credits are exhausted.

import { connectorAdapter } from '@/lib/adapters';

function isEnabled() {
  try { return localStorage.getItem('homa_gcal_sync') === 'true'; } catch { return false; }
}

function toInputs(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export async function syncReminderToGCal(reminder) {
  if (!isEnabled()) return;
  try {
    const dt = new Date(reminder.remind_at);
    if (isNaN(dt.getTime())) return;
    const { date, time } = toInputs(dt);
    await connectorAdapter.createCalendarEvent({
      title: '🔔 ' + (reminder.title || 'یادآور'),
      date, time, duration: 15,
    });
  } catch {}
}

export async function syncJobToGCal(job) {
  if (!isEnabled()) return;
  try {
    const dt = job.created_date ? new Date(job.created_date) : new Date();
    if (isNaN(dt.getTime())) return;
    const { date, time } = toInputs(dt);
    await connectorAdapter.createCalendarEvent({
      title: '🎬 ' + (job.capability || 'AI Job') + ' — ' + (job.provider || 'Homa'),
      date, time, duration: 30,
    });
  } catch {}
}
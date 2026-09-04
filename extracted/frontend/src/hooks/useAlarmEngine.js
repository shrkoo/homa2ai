// Alarm Engine — checks due alarms/reminders every second while app is open.
// Triggers full-screen overlay + sound + voice. This is a web-based engine:
// alarms only fire while the app is open. Native background alarms require
// a native wrapper (Android AlarmManager) which is not available in this web app.

import { useEffect, useRef, useState, useCallback } from 'react';
import { alarms as alarmStore, reminders as reminderStore, history as historyStore } from '@/lib/alarmStore';

// Compute next trigger time for an alarm
export function computeNextTrigger(alarm, from = new Date()) {
  const now = new Date(from);
  const target = new Date(now);
  target.setHours(alarm.hour, alarm.minute, alarm.second || 0, 0);

  const todayMatch = () => {
    if (target <= now) return false;
    return matchesDay(alarm, now.getDay());
  };

  if (alarm.recurring_type === 'once') {
    if (target <= now) target.setDate(target.getDate() + 1);
    return target;
  }

  // For recurring, find next matching day
  for (let i = 0; i < 8; i++) {
    const check = new Date(target);
    check.setDate(check.getDate() + i);
    if (check <= now) continue;
    if (matchesDay(alarm, check.getDay())) {
    check.setHours(alarm.hour, alarm.minute, alarm.second || 0, 0);
    if (check > now) return check;
    }
  }
  // fallback
  target.setDate(target.getDate() + 1);
  return target;
}

function matchesDay(alarm, dayOfWeek) {
  const d = dayOfWeek;
  switch (alarm.recurring_type) {
    case 'daily': return true;
    case 'weekdays': return d >= 0 && d <= 4; // Sun-Thu (adjust as needed; 0=Sun)
    case 'weekly': return (alarm.days_of_week || []).includes(d);
    case 'custom': return (alarm.days_of_week || []).includes(d);
    case 'biweekly': return (alarm.days_of_week || []).includes(d);
    case 'monthly': return true; // simplification: same day each month
    case 'once': return true;
    default: return true;
  }
}

export function useAlarmEngine(onTrigger) {
  const [activeAlarm, setActiveAlarm] = useState(null);
  const [alarms, setAlarms] = useState([]);
  const [reminders, setReminders] = useState([]);
  const triggerRef = useRef(onTrigger);
  const firedRef = useRef({}); // key: alarmId/reminderId + '_' + scheduledISO → true (dedup per scheduled instant)

  useEffect(() => { triggerRef.current = onTrigger; }, [onTrigger]);

  // Allow manual "test alarm" triggers (from AlarmList / AlarmForm test buttons)
  useEffect(() => {
    const handler = (e) => {
      const alarm = e.detail?.alarm;
      if (alarm) {
        setActiveAlarm({ type: 'alarm', data: alarm });
        triggerRef.current?.({ type: 'alarm', data: alarm });
        historyStore.create({ alarm_id: alarm.id || '', entry_type: 'alarm', title: alarm.title, action: 'triggered', triggered_at: new Date().toISOString(), details: 'test' }).catch(() => {});
      }
    };
    window.addEventListener('homa-test-alarm', handler);
    return () => window.removeEventListener('homa-test-alarm', handler);
  }, []);

  const loadAlarms = useCallback(async () => {
    try {
      const a = await alarmStore.filter({ active: true });
      setAlarms(a);
      const r = await reminderStore.filter({ status: 'pending' });
      setReminders(r);
    } catch {}
  }, []);

  useEffect(() => {
    loadAlarms();
    const interval = setInterval(loadAlarms, 30000); // refresh list every 30s
    return () => clearInterval(interval);
  }, [loadAlarms]);

  useEffect(() => {
    const check = () => {
      const now = new Date();
      // Check alarms
      for (const alarm of alarms) {
        if (!alarm.active) continue;
        const next = new Date(alarm.next_trigger || computeNextTrigger(alarm, now).toISOString());
        if (isNaN(next)) continue;
        const fireKey = alarm.id + '_' + next.toISOString();
        if (now >= next && !firedRef.current[fireKey]) {
          firedRef.current[fireKey] = true;
          setActiveAlarm({ type: 'alarm', data: alarm });
          triggerRef.current?.({ type: 'alarm', data: alarm });
          alarmStore.update(alarm.id, { last_triggered: now.toISOString(), snooze_count: 0 }).catch(() => {});
          historyStore.create({ alarm_id: alarm.id, entry_type: 'alarm', title: alarm.title, action: 'triggered', triggered_at: now.toISOString() }).catch(() => {});
          break;
        }
      }
      // Check time-based reminders
      for (const rem of reminders) {
        if (rem.reminder_type !== 'time' && rem.reminder_type !== 'recurring') continue;
        if (rem.status !== 'pending') continue;
        const remindAt = new Date(rem.remind_at);
        if (isNaN(remindAt)) continue;
        const fireKey = rem.id + '_' + remindAt.toISOString();
        if (now >= remindAt && !firedRef.current[fireKey]) {
          firedRef.current[fireKey] = true;
          setActiveAlarm({ type: 'reminder', data: rem });
          triggerRef.current?.({ type: 'reminder', data: rem });
          reminderStore.update(rem.id, { last_triggered: now.toISOString() }).catch(() => {});
          historyStore.create({ reminder_id: rem.id, entry_type: 'reminder', title: rem.title, action: 'triggered', triggered_at: now.toISOString() }).catch(() => {});
          break;
        }
      }
    };

    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [alarms, reminders]);

  const dismissAlarm = useCallback(async (entry) => {
    const now = new Date().toISOString();
    if (entry.type === 'alarm') {
      const alarm = entry.data;
      const next = computeNextTrigger(alarm, new Date());
      await alarmStore.update(alarm.id, { next_trigger: next.toISOString(), snooze_count: 0 }).catch(() => {});
      await historyStore.create({ alarm_id: alarm.id, entry_type: 'alarm', title: alarm.title, action: 'dismissed', triggered_at: now }).catch(() => {});
    } else {
      await reminderStore.update(entry.data.id, { status: 'done' }).catch(() => {});
      await historyStore.create({ reminder_id: entry.data.id, entry_type: 'reminder', title: entry.data.title, action: 'dismissed', triggered_at: now }).catch(() => {});
    }
    setActiveAlarm(null);
  }, []);

  const snoozeAlarm = useCallback(async (entry, minutes) => {
    const snoozeTime = new Date(Date.now() + minutes * 60000);
    const now = new Date().toISOString();
    if (entry.type === 'alarm') {
      const alarm = entry.data;
      const newCount = (alarm.snooze_count || 0) + 1;
      await alarmStore.update(alarm.id, { next_trigger: snoozeTime.toISOString(), snooze_count: newCount }).catch(() => {});
      await historyStore.create({ alarm_id: alarm.id, entry_type: 'alarm', title: alarm.title, action: 'snoozed', triggered_at: now, snooze_count: newCount }).catch(() => {});
    } else {
      await reminderStore.update(entry.data.id, { remind_at: snoozeTime.toISOString(), status: 'snoozed' }).catch(() => {});
      await historyStore.create({ reminder_id: entry.data.id, entry_type: 'reminder', title: entry.data.title, action: 'snoozed', triggered_at: now }).catch(() => {});
      // Re-activate after snooze
      setTimeout(() => { reminderStore.update(entry.data.id, { status: 'pending' }).catch(() => {}); }, minutes * 60000);
    }
    setActiveAlarm(null);
  }, []);

  const completeAlarm = useCallback(async (entry) => {
    const now = new Date().toISOString();
    if (entry.type === 'alarm') {
      const alarm = entry.data;
      const next = computeNextTrigger(alarm, new Date());
      await alarmStore.update(alarm.id, { next_trigger: next.toISOString(), snooze_count: 0 }).catch(() => {});
      await historyStore.create({ alarm_id: alarm.id, entry_type: 'alarm', title: alarm.title, action: 'completed', triggered_at: now }).catch(() => {});
    } else {
      await reminderStore.update(entry.data.id, { status: 'done' }).catch(() => {});
      await historyStore.create({ reminder_id: entry.data.id, entry_type: 'reminder', title: entry.data.title, action: 'completed', triggered_at: now }).catch(() => {});
    }
    setActiveAlarm(null);
  }, []);

  return { activeAlarm, dismissAlarm, snoozeAlarm, completeAlarm, refresh: loadAlarms };
}
/**
 * alarmAdapter.js — Alarm & Reminder operations (B25/B16).
 *
 * CRUD + ownership. Scheduling/trigger handled by alarmStore (IndexedDB)
 * for offline-first; cloud sync via Worker when configured.
 */

import { entities } from '@/lib/dataStore';

export const alarmAdapter = {
  // ── Alarms ─────────────────────────────────────────────────

  async listAlarms(sort = '-created_date', limit = 200) {
    return entities.Alarm.list(sort, limit);
  },

  async getAlarm(id) {
    return entities.Alarm.get(id);
  },

  async createAlarm(data) {
    return entities.Alarm.create(data);
  },

  async updateAlarm(id, data) {
    return entities.Alarm.update(id, data);
  },

  async deleteAlarm(id) {
    return entities.Alarm.delete(id);
  },

  async toggleAlarm(id, active) {
    return entities.Alarm.update(id, { active });
  },

  // ── Reminders ──────────────────────────────────────────────

  async listReminders(sort = 'remind_at', limit = 200) {
    return entities.Reminder.list(sort, limit);
  },

  async getReminder(id) {
    return entities.Reminder.get(id);
  },

  async createReminder(data) {
    return entities.Reminder.create(data);
  },

  async updateReminder(id, data) {
    return entities.Reminder.update(id, data);
  },

  async deleteReminder(id) {
    return entities.Reminder.delete(id);
  },

  async completeReminder(id) {
    return entities.Reminder.update(id, { status: 'done' });
  },

  async snoozeReminder(id, snoozeDuration) {
    const reminder = await entities.Reminder.get(id);
    const newTime = new Date(Date.now() + snoozeDuration * 60000).toISOString();
    return entities.Reminder.update(id, {
      remind_at: newTime,
      status: 'snoozed',
    });
  },

  // ── Alarm History ──────────────────────────────────────────

  async listAlarmHistory(limit = 100) {
    return entities.AlarmHistory.list('-triggered_at', limit);
  },

  async createAlarmHistory(data) {
    return entities.AlarmHistory.create(data);
  },

  async clearAlarmHistory() {
    return entities.AlarmHistory.deleteMany({});
  },

  // ── Price Reminders ────────────────────────────────────────

  async listPriceReminders() {
    return entities.PriceReminder.list('-created_date', 100);
  },

  async createPriceReminder(data) {
    return entities.PriceReminder.create(data);
  },

  async updatePriceReminder(id, data) {
    return entities.PriceReminder.update(id, data);
  },

  async deletePriceReminder(id) {
    return entities.PriceReminder.delete(id);
  },
};

export default alarmAdapter;
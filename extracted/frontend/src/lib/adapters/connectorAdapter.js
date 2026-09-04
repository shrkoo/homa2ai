/**
 * connectorAdapter.js — External service connectors (B20/B16).
 *
 * Wraps Google Calendar/Sheets/Docs/Tasks and tool connections.
 * Token storage is encrypted in Worker KV; Base44 connectors as fallback.
 */

import { invokeFunctionDirect } from '@/lib/directInvoke';

export const connectorAdapter = {
  // ── Google ─────────────────────────────────────────────────

  async getGoogleStatus() {
    try {
      return await invokeFunctionDirect('googleStatus', {});
    } catch {
      return { connected: false };
    }
  },

  async disconnectGoogle() {
    try {
      return await invokeFunctionDirect('googleDisconnect', {});
    } catch {
      return { ok: true };
    }
  },

  async createGoogleTask(data) {
    return invokeFunctionDirect('googleTasksCreate', data);
  },

  async createCalendarEvent(data) {
    return invokeFunctionDirect('googleCalendarCreate', data);
  },

  // ── Generic Tool Connections ───────────────────────────────

  async connectTool(toolId, providerId, connectionData) {
    return invokeFunctionDirect('connectTool', { tool_id: toolId, provider_id: providerId, ...connectionData });
  },

  async disconnectTool(toolId) {
    return invokeFunctionDirect('disconnectTool', { tool_id: toolId });
  },

  async getConnectionStatus(toolId) {
    return invokeFunctionDirect('connectionStatus', { tool_id: toolId });
  },

  // ── User Connections (entity-backed) ──────────────────────

  async listUserConnections() {
    const { entities } = await import('@/lib/dataStore');
    return entities.UserConnection.list('-created_date', 100);
  },

  async deleteUserConnection(id) {
    const { entities } = await import('@/lib/dataStore');
    return entities.UserConnection.delete(id);
  },

  async createUserConnection(data) {
    const { entities } = await import('@/lib/dataStore');
    return entities.UserConnection.create(data);
  },

  async updateUserConnection(id, data) {
    const { entities } = await import('@/lib/dataStore');
    return entities.UserConnection.update(id, data);
  },

  async filterUserConnections(query) {
    const { entities } = await import('@/lib/dataStore');
    return entities.UserConnection.filter(query, '-created_date', 100);
  },

  // ── Google Exports ─────────────────────────────────────────

  async exportToDocs(data) {
    return invokeFunctionDirect('exportToDocs', data);
  },

  async exportToSheets(data) {
    return invokeFunctionDirect('exportToSheets', data);
  },
};

export default connectorAdapter;
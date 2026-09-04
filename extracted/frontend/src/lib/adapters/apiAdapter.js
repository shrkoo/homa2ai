/**
 * apiAdapter.js — Developer API platform (Worker-backed, no Base44).
 *
 * Calls the Worker's /api/* routes directly with X-User-Token auth.
 */

import { entities } from '@/lib/dataStore';
import { invokeFunctionDirect } from '@/lib/directInvoke';

const getWorkerUrl = () => {
  try {
    return (localStorage.getItem('homa_worker_url') || 'https://homa-ai-core.shahramalidazeh620.workers.dev').trim().replace(/\/$/, '');
  } catch {
    return '';
  }
};

const getToken = () => {
  try {
    return localStorage.getItem('base44_access_token') || '';
  } catch {
    return '';
  }
};

async function apiFetch(path, options = {}) {
  const url = getWorkerUrl();
  const token = getToken();
  if (!url) throw new Error('Worker not configured');
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(url + path, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Token': token,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    let msg = 'api_' + res.status;
    try { const j = await res.json(); if (j?.error) msg = j.error; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export const apiAdapter = {
  // ── API Keys ───────────────────────────────────────────────

  async listKeys() {
    const data = await apiFetch('/api/keys');
    return data.keys || data.items || [];
  },

  async createKey(label) {
    return apiFetch('/api/keys', { method: 'POST', body: { label } });
  },

  async revokeKey(id) {
    return apiFetch(`/api/keys/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // ── API Credits ────────────────────────────────────────────

  async listApiCredits() {
    return entities.ApiCredit.list('-created_date', 50);
  },

  async getApiCredit(id) {
    return entities.ApiCredit.get(id);
  },

  // ── API Usage ──────────────────────────────────────────────

  async listApiUsage(limit = 100) {
    const data = await apiFetch('/api/usage?limit=' + limit);
    return data.usage || data.items || [];
  },

  // ── API Jobs ───────────────────────────────────────────────

  async listJobs(limit = 50) {
    return entities.ApiJob.list('-created_date', limit);
  },

  async getJob(id) {
    return entities.ApiJob.get(id);
  },

  async createJob(data) {
    return entities.ApiJob.create(data);
  },

  async updateJob(id, data) {
    return entities.ApiJob.update(id, data);
  },

  async cancelJob(jobId) {
    return invokeFunctionDirect('cancelJob', { job_id: jobId });
  },

  // ── Health ─────────────────────────────────────────────────

  async healthCheck() {
    return apiFetch('/api/health');
  },
};

export default apiAdapter;
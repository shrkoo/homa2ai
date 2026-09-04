/**
 * searchAdapter.js — Web Search, Deep Research, Analyzers (B22/B16).
 *
 * Each analyzer has full pipeline: validation → Worker → provider →
 * result → error handling → credit accounting.
 */

import { invokeFunctionDirect } from '@/lib/directInvoke';

export const searchAdapter = {
  // ── Web Search ─────────────────────────────────────────────

  async webSearch(query, options = {}) {
    return invokeFunctionDirect('webSearch', { query, ...options });
  },

  async smartSearch(query, options = {}) {
    return invokeFunctionDirect('smartSearch', { query, ...options });
  },

  // ── Deep Research ──────────────────────────────────────────

  async deepResearch(query, options = {}) {
    return invokeFunctionDirect('deepResearch', { query, ...options });
  },

  // ── Analyzers ──────────────────────────────────────────────

  async analyzeWebsite(url, options = {}) {
    return invokeFunctionDirect('analyzeWebsite', { url, ...options });
  },

  async analyzeInstagram(handle, options = {}) {
    return invokeFunctionDirect('analyzeInstagram', { handle, ...options });
  },

  async analyzeTikTok(handle, options = {}) {
    return invokeFunctionDirect('analyzeTikTok', { handle, ...options });
  },

  async analyzeFacebook(handle, options = {}) {
    return invokeFunctionDirect('analyzeFacebook', { handle, ...options });
  },

  // ── Search History ─────────────────────────────────────────

  async listSearchHistory(limit = 50) {
    const { entities } = await import('@/lib/dataStore');
    return entities.SearchHistory.list('-created_date', limit);
  },

  async createSearchHistory(query, language = 'fa') {
    const { entities } = await import('@/lib/dataStore');
    return entities.SearchHistory.create({ query, language });
  },

  async deleteSearchHistory(id) {
    const { entities } = await import('@/lib/dataStore');
    return entities.SearchHistory.delete(id);
  },

  async clearSearchHistory() {
    const { entities } = await import('@/lib/dataStore');
    return entities.SearchHistory.deleteMany({});
  },
};

export default searchAdapter;
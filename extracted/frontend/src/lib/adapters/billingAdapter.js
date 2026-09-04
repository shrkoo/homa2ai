/**
 * billingAdapter.js — Credits, Usage, Orders, Plans (B6/B11/B16).
 *
 * Credit ledger and payment operations go through the Worker when
 * configured (atomic D1 transactions), Base44 as fallback.
 */

import { entities } from '@/lib/dataStore';
import { invokeFunctionDirect } from '@/lib/directInvoke';

export const billingAdapter = {
  // ── Usage / Balance ─────────────────────────────────────────

  async getUsage() {
    const list = await entities.Usage.list('-created_date', 1);
    return list[0] || null;
  },

  async refreshUsage() {
    return invokeFunctionDirect('getUsage', {});
  },

  // ── Plans ───────────────────────────────────────────────────

  async listPlans() {
    return entities.Plan.list('sort', 20);
  },

  async getPlan(id) {
    return entities.Plan.get(id);
  },

  // ── Feature Costs ───────────────────────────────────────────

  async listFeatureCosts() {
    return entities.FeatureCost.list('feature', 20);
  },

  // ── Orders ──────────────────────────────────────────────────

  async listOrders() {
    return entities.Order.list('-created_date', 50);
  },

  async getOrder(id) {
    return entities.Order.get(id);
  },

  async createPayment(data) {
    return invokeFunctionDirect('createZarinpalPayment', data);
  },

  async verifyPayment(authority, status) {
    return invokeFunctionDirect('zarinpalCallback', { authority, status });
  },

  // ── Credit Transactions (Worker only — atomic ledger) ──────

  async listCreditTransactions(limit = 50) {
    return entities.CreditTransaction.list('-created_date', limit);
  },
};

export default billingAdapter;
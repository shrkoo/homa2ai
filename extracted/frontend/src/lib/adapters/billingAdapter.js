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
    const rows = await entities.Usage.list('-created_date', 1);
    return rows[0] || null;
  },

  // ── Plans ───────────────────────────────────────────────────

  async listPlans() {
    // Plan is public-read in D1; include an active filter because the Worker requires a WHERE clause.
    return entities.Plan.filter({ active: 1 }, 'id', 20);
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
    const planId = typeof data === 'string' ? data : data?.plan;
    if (!planId) throw new Error('plan_required');
    const plan = await entities.Plan.get(planId);
    const amount = Number(plan?.price ?? plan?.price_toman ?? 0);
    const credits = Number(plan?.credits || 0);
    if (!plan || !plan.active || amount <= 0 || credits <= 0) {
      throw new Error('این طرح هنوز در پایگاه دادهٔ هُما تنظیم نشده است.');
    }
    const result = await invokeFunctionDirect('createZarinpalPayment', {
      amount,
      plan: plan.id,
      credits,
      description: plan.name_fa || plan.name_en || plan.name || plan.id,
    });
    const payload = result?.data || result;
    return { ...payload, gatewayUrl: payload?.redirect_url };
  },

  async getPaymentStatus(orderId) {
    return invokeFunctionDirect('getPaymentStatus', { order_id: orderId });
  },

  async verifyPayment(orderId) {
    return this.getPaymentStatus(orderId);
  },

  // ── Credit Transactions (Worker only — atomic ledger) ──────

  async listCreditTransactions(limit = 50) {
    return entities.CreditTransaction.list('-created_date', limit);
  },
};

export default billingAdapter;
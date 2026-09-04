/**
 * Homa AI — Payment Abstraction (B11)
 *
 * Provider: ZarinPal (Iranian payment gateway)
 *
 * If ZARINPAL_MERCHANT_ID is not set as a Worker secret:
 *   returns { error: 'NO_PAYMENT_PROVIDER' }
 *
 * NEVER fakes a successful payment. NEVER returns success without
 * actual gateway verification.
 *
 * Flow:
 *   1. createPayment(env, { amount, description, callback_url, user_id })
 *      → { authority, redirect_url } or { error }
 *   2. verifyPayment(env, { authority, amount })
 *      → { ok, ref_id } or { error: 'PAYMENT_FAILED' }
 *
 * Callback URL must point to the Worker: /payments/zarinpal/callback
 */

import { ErrorCodes } from './errors.js';

const ZARINPAL_API = 'https://api.zarinpal.com/pg/v4/payment/request.json';
const ZARINPAL_VERIFY = 'https://api.zarinpal.com/pg/v4/payment/verify.json';
const ZARINPAL_REDIRECT = 'https://www.zarinpal.com/pg/StartPay/';

// ===== ZarinPal Adapter =====
async function zarinpalCreate(env, { amount, description, callback_url }) {
  const merchantId = env.ZARINPAL_MERCHANT_ID;
  if (!merchantId) return { error: ErrorCodes.NO_PAYMENT_PROVIDER };

  try {
    const res = await fetch(ZARINPAL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: merchantId,
        amount,
        description: description || 'Homa AI Credits',
        callback_url,
      }),
    });

    const data = await res.json();
    const authority = data?.data?.authority;
    if (!authority) {
      return { error: ErrorCodes.PAYMENT_FAILED, detail: data?.errors?.message || 'No authority' };
    }

    return { authority, redirect_url: ZARINPAL_REDIRECT + authority };
  } catch (e) {
    return { error: ErrorCodes.PAYMENT_FAILED, message: e.message };
  }
}

async function zarinpalVerify(env, { authority, amount }) {
  const merchantId = env.ZARINPAL_MERCHANT_ID;
  if (!merchantId) return { error: ErrorCodes.NO_PAYMENT_PROVIDER };

  try {
    const res = await fetch(ZARINPAL_VERIFY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: merchantId,
        amount,
        authority,
      }),
    });

    const data = await res.json();
    const refId = data?.data?.ref_id;
    const code = data?.data?.code;

    // ZarinPal: code 100 or 101 (already verified) = success
    if (code === 100 || code === 101) {
      return { ok: true, ref_id: String(refId || code) };
    }

    return { error: ErrorCodes.PAYMENT_FAILED, code, detail: data?.errors?.message || 'Verification failed' };
  } catch (e) {
    return { error: ErrorCodes.PAYMENT_FAILED, message: e.message };
  }
}

// ===== Main payment API =====
export const payments = {
  isAvailable(env) {
    return !!env.ZARINPAL_MERCHANT_ID;
  },

  async createPayment(env, opts) {
    return await zarinpalCreate(env, opts);
  },

  async verifyPayment(env, opts) {
    return await zarinpalVerify(env, opts);
  },

  // Create an order record in D1 before redirecting to gateway
  async createOrder(env, { userId, amount, plan, credits, authority, description }) {
    if (!env.DB) return { error: 'NO_DB' };
    const id = 'order_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    try {
      await env.DB.prepare(
        'INSERT INTO orders (id, user_id, amount, plan, credits, status, authority, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(id, userId, amount, plan, credits, 'pending', authority || '', description || '').run();
      return { id };
    } catch (e) {
      return { error: 'DB_ERROR', message: e.message };
    }
  },

  // Mark order as paid + grant credits (atomic)
  async completeOrder(env, orderId, refId) {
    if (!env.DB) return { error: 'NO_DB' };
    try {
      const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first();
      if (!order) return { error: 'ORDER_NOT_FOUND' };
      if (order.status === 'paid') return { ok: true, already_paid: true, order };

      // Atomic: update order + grant credits
      const usage = await env.DB.prepare('SELECT credits FROM usage WHERE user_id = ?').bind(order.user_id).first();
      if (!usage) return { error: 'NO_USAGE_RECORD' };

      const balanceBefore = usage.credits;
      const balanceAfter = balanceBefore + order.credits;
      const txnId = 'txn_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);

      await env.DB.batch([
        env.DB.prepare('UPDATE orders SET status = ?, ref_id = ?, credits_added = 1, updated_at = ? WHERE id = ?')
          .bind('paid', refId, 1, new Date().toISOString(), orderId),
        env.DB.prepare('UPDATE usage SET credits = ?, paid_total = paid_total + ?, updated_at = ? WHERE user_id = ?')
          .bind(balanceAfter, order.credits, new Date().toISOString(), order.user_id),
        env.DB.prepare(
          'INSERT INTO credit_transactions (id, user_id, type, amount, balance_before, balance_after, reference_id, capability, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(txnId, order.user_id, 'purchase', order.credits, balanceBefore, balanceAfter, orderId, '', 'completed'),
      ]);

      return { ok: true, order_id: orderId, balance_after: balanceAfter };
    } catch (e) {
      return { error: 'DB_ERROR', message: e.message };
    }
  },
};
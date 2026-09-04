/**
 * Homa AI — Credit Ledger (B6)
 *
 * Atomic credit operations with a full transaction ledger.
 * Every credit change is recorded in credit_transactions.
 *
 * Operations:
 *   consume — deduct credits for a capability usage (ATOMIC conditional UPDATE)
 *   refund  — return credits on provider failure (ATOMIC)
 *   grant   — add credits (admin, referral, purchase) (ATOMIC)
 *
 * Race-condition safe: consume uses a single conditional UPDATE
 * (WHERE credits >= ?) so concurrent requests cannot overdraw.
 * User cannot increase credits by manipulating the frontend.
 */

import { ErrorCodes } from './errors.js';

// ===== Capability costs (credits per use) =====
const CAPABILITY_COSTS = {
  chat: 1,
  reasoning: 2,
  coding: 2,
  vision: 3,
  web_search: 2,
  deep_research: 5,
  image_generate: 5,
  image_edit: 5,
  video_generate: 20,
  video_analysis: 5,
  stt: 3,
  tts: 1,
  file_analysis: 3,
  website_analyzer: 2,
  instagram_analyzer: 2,
  tiktok_analyzer: 2,
  facebook_analyzer: 2,
};

export function getCapabilityCost(capability) {
  return CAPABILITY_COSTS[capability] || 1;
}

// ===== Get or create usage record =====
export async function getOrCreateUsage(env, userId) {
  if (!env.DB) return null;
  try {
    let row = await env.DB.prepare('SELECT * FROM usage WHERE user_id = ?').bind(userId).first();
    if (!row) {
      const id = 'usage_' + userId.slice(0, 12);
      await env.DB.prepare(
        'INSERT INTO usage (id, user_id, credits, plan) VALUES (?, ?, 30, ?)'
      ).bind(id, userId, 'free').run();
      row = await env.DB.prepare('SELECT * FROM usage WHERE user_id = ?').bind(userId).first();
    }
    return row;
  } catch (e) {
    return null;
  }
}

// ===== Check if user has enough credits =====
export async function checkCredits(env, userId, capability) {
  const usage = await getOrCreateUsage(env, userId);
  if (!usage) return { ok: false, error: 'NO_DB', cost: 0, balance: 0 };
  const cost = getCapabilityCost(capability);
  if (usage.credits < cost) {
    return { ok: false, error: ErrorCodes.INSUFFICIENT_CREDITS, cost, balance: usage.credits };
  }
  return { ok: true, cost, balance: usage.credits };
}

// ===== Consume credits (ATOMIC — race-condition safe) =====
// Uses a single conditional UPDATE: only deducts if balance >= cost.
// If meta.changes === 0, either user doesn't exist or insufficient credits.
export async function consumeCredits(env, userId, capability, referenceId) {
  if (!env.DB) return { ok: false, error: 'NO_DB' };
  const cost = getCapabilityCost(capability);
  const txnId = 'txn_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  const now = new Date().toISOString();

  try {
    // Atomic conditional UPDATE — prevents race condition / negative balance
    const result = await env.DB.prepare(
      'UPDATE usage SET credits = credits - ?, total_consumed = total_consumed + ?, updated_at = ? WHERE user_id = ? AND credits >= ?'
    ).bind(cost, cost, now, userId, cost).run();

    if (result.meta.changes === 0) {
      // Either no usage record or insufficient credits
      const usage = await env.DB.prepare('SELECT credits FROM usage WHERE user_id = ?').bind(userId).first();
      if (!usage) return { ok: false, error: 'NO_USAGE_RECORD' };
      return { ok: false, error: ErrorCodes.INSUFFICIENT_CREDITS, balance: usage.credits, cost };
    }

    // Read new balance for the ledger entry
    const usage = await env.DB.prepare('SELECT credits FROM usage WHERE user_id = ?').bind(userId).first();
    const balanceAfter = usage.credits;
    const balanceBefore = balanceAfter + cost;

    await env.DB.prepare(
      'INSERT INTO credit_transactions (id, user_id, type, amount, balance_before, balance_after, reference_id, capability, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(txnId, userId, 'consume', -cost, balanceBefore, balanceAfter, referenceId || '', capability, 'completed').run();

    return { ok: true, balance_before: balanceBefore, balance_after: balanceAfter, cost, txn_id: txnId };
  } catch (e) {
    return { ok: false, error: 'DB_ERROR', message: e.message };
  }
}

// ===== Refund credits (ATOMIC) =====
export async function refundCredits(env, userId, capability, referenceId, reason) {
  if (!env.DB) return { ok: false, error: 'NO_DB' };
  const cost = getCapabilityCost(capability);
  const txnId = 'txn_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  const now = new Date().toISOString();

  try {
    // Atomic UPDATE — add credits back
    const result = await env.DB.prepare(
      'UPDATE usage SET credits = credits + ?, updated_at = ? WHERE user_id = ?'
    ).bind(cost, now, userId).run();

    if (result.meta.changes === 0) return { ok: false, error: 'NO_USAGE_RECORD' };

    const usage = await env.DB.prepare('SELECT credits FROM usage WHERE user_id = ?').bind(userId).first();
    const balanceAfter = usage.credits;
    const balanceBefore = balanceAfter - cost;

    await env.DB.prepare(
      'INSERT INTO credit_transactions (id, user_id, type, amount, balance_before, balance_after, reference_id, capability, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(txnId, userId, 'refund', cost, balanceBefore, balanceAfter, referenceId || '', capability, 'refunded').run();

    return { ok: true, balance_before: balanceBefore, balance_after: balanceAfter, txn_id: txnId };
  } catch (e) {
    return { ok: false, error: 'DB_ERROR', message: e.message };
  }
}

// ===== Grant credits (ATOMIC — admin, referral, purchase) =====
export async function grantCredits(env, userId, amount, type, referenceId, capability) {
  if (!env.DB || amount <= 0) return { ok: false, error: 'INVALID_AMOUNT' };
  const txnId = 'txn_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  const now = new Date().toISOString();

  try {
    // Ensure usage record exists
    await getOrCreateUsage(env, userId);

    // Atomic UPDATE
    const result = await env.DB.prepare(
      'UPDATE usage SET credits = credits + ?, paid_total = paid_total + ?, updated_at = ? WHERE user_id = ?'
    ).bind(amount, amount, now, userId).run();

    if (result.meta.changes === 0) return { ok: false, error: 'NO_USAGE_RECORD' };

    const usage = await env.DB.prepare('SELECT credits FROM usage WHERE user_id = ?').bind(userId).first();
    const balanceAfter = usage.credits;
    const balanceBefore = balanceAfter - amount;

    await env.DB.prepare(
      'INSERT INTO credit_transactions (id, user_id, type, amount, balance_before, balance_after, reference_id, capability, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(txnId, userId, type || 'grant', amount, balanceBefore, balanceAfter, referenceId || '', capability || '', 'completed').run();

    return { ok: true, balance_before: balanceBefore, balance_after: balanceAfter, txn_id: txnId };
  } catch (e) {
    return { ok: false, error: 'DB_ERROR', message: e.message };
  }
}

// ===== Get transaction history =====
export async function getTransactionHistory(env, userId, limit) {
  if (!env.DB) return [];
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
    ).bind(userId, Math.min(limit || 50, 200)).all();
    return results || [];
  } catch {
    return [];
  }
}
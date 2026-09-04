/**
 * Homa AI — Referral Routes (B10)
 * Anti-abuse: self-referral blocked, reward granted only once per referred user,
 * reward is granted server-side only.
 */
import { requireAuth } from '../lib/auth.js';
import { successResponse, errorResponse, ErrorCodes } from '../lib/errors.js';
import { grantCredits } from '../lib/credits.js';

const REFERRAL_REWARD_CREDITS = 30;

function makeReferralCode(userId) { return 'homa-' + userId.slice(0, 12); }

export async function handleReferralRoutes(request, env, url, user) {
  const path = url.pathname;
  const method = request.method;
  if (!env.DB) return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, 'Database not configured');

  if (path === '/referrals/status' && method === 'GET') {
    try {
      const { results: referrals } = await env.DB.prepare('SELECT * FROM referrals WHERE referrer_id = ? ORDER BY created_at DESC').bind(user.id).all();
      const totalReferred = referrals.length;
      const rewarded = referrals.filter(r => r.status === 'rewarded').length;
      const totalCredits = referrals.reduce((sum, r) => sum + (r.credits_awarded || 0), 0);
      return successResponse({ referral_code: makeReferralCode(user.id), total_referred: totalReferred, total_rewarded: rewarded, total_credits_earned: totalCredits, referrals: referrals || [] });
    } catch (e) { return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message); }
  }

  if (path === '/referrals/process' && method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return errorResponse(ErrorCodes.INVALID_INPUT); }
    const { referred_user_id, referred_email, referrer_code } = body;
    if (!referred_user_id || !referrer_code) return errorResponse(ErrorCodes.INVALID_INPUT, 400, 'شناسه کاربر و کد معرف الزامی است.');
    if (!referrer_code.startsWith('homa-')) return errorResponse(ErrorCodes.INVALID_INPUT, 400, 'کد معرف نامعتبر.');
    const referrerId = referrer_code.slice(5);
    try {
      const referrer = await env.DB.prepare("SELECT id FROM users WHERE substr(id, 1, 12) = ? LIMIT 1").bind(referrerId).first();
      if (!referrer) return errorResponse(ErrorCodes.NOT_FOUND, 404, 'معرف یافت نشد.');
      if (referrer.id === referred_user_id) return errorResponse(ErrorCodes.FORBIDDEN, 403, 'ارجاع به خود مجاز نیست.');
      const existing = await env.DB.prepare('SELECT id FROM referrals WHERE referrer_id = ? AND referred_user_id = ?').bind(referrer.id, referred_user_id).first();
      if (existing) return successResponse({ already_processed: true });
      const referralId = 'ref_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
      await env.DB.prepare('INSERT INTO referrals (id, referrer_id, referred_user_id, referred_email, status, credits_awarded) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(referralId, referrer.id, referred_user_id, referred_email || '', 'pending', 0).run();
      const grantResult = await grantCredits(env, referrer.id, REFERRAL_REWARD_CREDITS, 'referral', referralId, 'referral');
      if (grantResult.ok) {
        await env.DB.prepare('UPDATE referrals SET status = ?, credits_awarded = ? WHERE id = ?').bind('rewarded', REFERRAL_REWARD_CREDITS, referralId).run();
      }
      return successResponse({ referral_id: referralId, referrer_id: referrer.id, credits_awarded: grantResult.ok ? REFERRAL_REWARD_CREDITS : 0, status: grantResult.ok ? 'rewarded' : 'pending' });
    } catch (e) { return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message); }
  }

  return errorResponse(ErrorCodes.NOT_FOUND);
}
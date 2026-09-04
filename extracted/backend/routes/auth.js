/**
 * Homa AI — Independent Authentication Routes
 *
 * Fully independent email/password auth — no Base44 dependency.
 * Issues signed Homa tokens (HMAC-SHA256) that work as X-User-Token
 * for all other Worker API calls.
 *
 * Token format: homa_<userId>.<expiry>.<hmac>
 *
 * Routes:
 *   POST   /auth/register        — { email, password } → { otp_sent, dev_otp? }
 *   POST   /auth/verify-otp      — { email, otp_code } → { access_token, user }
 *   POST   /auth/login           — { email, password } → { access_token, user }
 *   POST   /auth/resend-otp      — { email } → { otp_sent }
 *   GET    /auth/me              — (X-User-Token) → { user }
 *   PATCH  /auth/profile         — (X-User-Token) { ...fields } → { user }
 *   POST   /auth/reset-request   — { email } → { sent }
 *   POST   /auth/reset           — { token, new_password } → { success }
 */
import {
  issueHomaToken,
  verifyHomaToken,
  deriveUserKey,
  hashPassword,
  verifyPassword,
  generateOtp,
  generateResetToken,
  checkRateLimit,
  getClientIp,
} from '../lib/auth.js';
import { successResponse, errorResponse, ErrorCodes } from '../lib/errors.js';

// ===== Email helpers (Resend API — optional) =====
async function sendOtpEmail(env, email, otpCode) {
  if (!env.RESEND_API_KEY) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Homa AI <noreply@resend.dev>',
        to: email,
        subject: 'کد تأیید هُما',
        html: `<div style="font-family:Vazirmatn,sans-serif;direction:rtl;text-align:center;padding:32px"><h2>هُما</h2><p style="font-size:18px">کد تأیید شما:</p><p style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#217 91% 60%">${otpCode}</p><p style="color:#666">این کد تا ۱۰ دقیقه معتبر است.</p></div>`,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sendResetEmail(env, email, resetToken) {
  if (!env.RESEND_API_KEY) return false;
  try {
    const resetUrl = `${env.APP_BASE_URL || 'https://capable-aria-chat-flow.base44.app'}/reset-password?token=${resetToken}`;
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Homa AI <noreply@resend.dev>',
        to: email,
        subject: 'بازیابی رمز عبور هُما',
        html: `<div style="font-family:Vazirmatn,sans-serif;direction:rtl;text-align:center;padding:32px"><h2>هُما</h2><p>برای بازیابی رمز عبور روی لینک زیر کلیک کنید:</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:#2389f5;color:#fff;border-radius:24px;text-decoration:none">بازیابی رمز عبور</a></p><p style="color:#666">این لینک تا ۱ ساعت معتبر است.</p></div>`,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ===== User helpers =====
function genUserId() {
  return 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
}

async function getUserByEmail(env, email) {
  if (!env.DB) return null;
  try {
    return await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  } catch {
    return null;
  }
}

async function getUserById(env, userId) {
  if (!env.DB) return null;
  try {
    return await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  } catch {
    return null;
  }
}

function sanitizeUser(row) {
  if (!row) return null;
  const { password_hash, otp_code, otp_expires_at, reset_token, reset_expires_at, ...publicFields } = row;
  return publicFields;
}

// ===== Route handler =====
export async function handleAuthRoutes(request, env, url) {
  const path = url.pathname;
  const method = request.method;

  // Auth routes are PUBLIC (no Bearer required).
  // Rate limiting protects against brute force.
  // /auth/me and /auth/profile require X-User-Token (checked individually).

  // ----- POST /auth/register -----
  if (path === '/auth/register' && method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return errorResponse(ErrorCodes.INVALID_INPUT); }
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return errorResponse(ErrorCodes.INVALID_INPUT, 400, 'ایمیل معتبر نیست');
    if (password.length < 6) return errorResponse(ErrorCodes.INVALID_INPUT, 400, 'رمز عبور حداقل ۶ کاراکتر');

    // Rate limit: 5 registrations per 10 minutes per IP
    const ip = getClientIp(request);
    if (!checkRateLimit('register:' + ip, 5, 10 * 60 * 1000)) {
      return errorResponse('RATE_LIMITED', 429, 'تلاش‌های زیاد. بعداً دوباره تلاش کنید');
    }

    if (!env.DB) return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, 'Database not configured');

    // Check if email already exists
    const existing = await getUserByEmail(env, email);
    if (existing) return errorResponse(ErrorCodes.INVALID_INPUT, 400, 'این ایمیل قبلاً ثبت شده');

    // Create user
    const userId = genUserId();
    const passwordHash = await hashPassword(password);
    const otpCode = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    try {
      await env.DB.prepare(
        'INSERT INTO users (id, email, role, password_hash, otp_code, otp_expires_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(userId, email, 'user', passwordHash, otpCode, otpExpiry).run();
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }

    // Send OTP via email (or return in response for dev)
    const emailSent = await sendOtpEmail(env, email, otpCode);
    return successResponse({
      otp_sent: true,
      ...(emailSent ? {} : { dev_otp: otpCode, dev_note: 'Email not configured — OTP returned in response' }),
    });
  }

  // ----- POST /auth/verify-otp -----
  if (path === '/auth/verify-otp' && method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return errorResponse(ErrorCodes.INVALID_INPUT); }
    const email = (body.email || '').trim().toLowerCase();
    const otpCode = (body.otp_code || '').trim();

    // Rate limit: 10 OTP attempts per 10 minutes per IP+email
    const ip = getClientIp(request);
    if (!checkRateLimit('otp:' + ip + ':' + email, 10, 10 * 60 * 1000)) {
      return errorResponse('RATE_LIMITED', 429, 'تلاش‌های زیاد. بعداً دوباره تلاش کنید');
    }

    if (!env.DB) return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, 'Database not configured');
    const user = await getUserByEmail(env, email);
    if (!user) return errorResponse(ErrorCodes.NOT_FOUND, 404, 'کاربر یافت نشد');
    if (!user.otp_code || user.otp_code !== otpCode) return errorResponse(ErrorCodes.INVALID_INPUT, 400, 'کد تأیید اشتباه');
    if (user.otp_expires_at && new Date(user.otp_expires_at) < new Date()) return errorResponse(ErrorCodes.INVALID_INPUT, 400, 'کد تأیید منقضی شده');

    // Clear OTP, mark as verified
    try {
      await env.DB.prepare('UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?')
        .bind('', '', user.id).run();
    } catch {}

    const token = await issueHomaToken(user.id, env);
    return successResponse({ access_token: token, user: sanitizeUser(user) });
  }

  // ----- POST /auth/login -----
  if (path === '/auth/login' && method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return errorResponse(ErrorCodes.INVALID_INPUT); }
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';

    // Rate limit: 10 login attempts per 10 minutes per IP
    const ip = getClientIp(request);
    if (!checkRateLimit('login:' + ip, 10, 10 * 60 * 1000)) {
      return errorResponse('RATE_LIMITED', 429, 'تلاش‌های زیاد. بعداً دوباره تلاش کنید');
    }

    if (!env.DB) return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, 'Database not configured');
    const user = await getUserByEmail(env, email);
    if (!user) return errorResponse(ErrorCodes.INVALID_INPUT, 401, 'ایمیل یا رمز عبور اشتباه');
    if (!user.password_hash) return errorResponse(ErrorCodes.INVALID_INPUT, 400, 'لطفاً رمز عبور را بازیابی کنید (حساب Base44 قدیمی)');

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) return errorResponse(ErrorCodes.INVALID_INPUT, 401, 'ایمیل یا رمز عبور اشتباه');

    const token = await issueHomaToken(user.id, env);
    return successResponse({ access_token: token, user: sanitizeUser(user) });
  }

  // ----- POST /auth/resend-otp -----
  if (path === '/auth/resend-otp' && method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return errorResponse(ErrorCodes.INVALID_INPUT); }
    const email = (body.email || '').trim().toLowerCase();

    // Rate limit: 3 resend requests per 10 minutes per IP+email
    const ip = getClientIp(request);
    if (!checkRateLimit('resend:' + ip + ':' + email, 3, 10 * 60 * 1000)) {
      return errorResponse('RATE_LIMITED', 429, 'تلاش‌های زیاد. بعداً دوباره تلاش کنید');
    }

    if (!env.DB) return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, 'Database not configured');
    const user = await getUserByEmail(env, email);
    if (!user) return successResponse({ otp_sent: true }); // Don't reveal if email exists

    const otpCode = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    try {
      await env.DB.prepare('UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?')
        .bind(otpCode, otpExpiry, user.id).run();
    } catch {}

    const emailSent = await sendOtpEmail(env, email, otpCode);
    return successResponse({ otp_sent: true, ...(emailSent ? {} : { dev_otp: otpCode }) });
  }

  // ----- GET /auth/me -----
  if (path === '/auth/me' && method === 'GET') {
    const userToken = request.headers.get('X-User-Token');
    if (!userToken) return errorResponse(ErrorCodes.AUTH_REQUIRED, 401, 'Token required');

    const verified = await verifyHomaToken(userToken, env);
    if (!verified) return errorResponse(ErrorCodes.AUTH_REQUIRED, 401, 'Invalid or expired token');

    if (!env.DB) return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, 'Database not configured');
    const user = await getUserById(env, verified.userId);
    if (!user) return errorResponse(ErrorCodes.NOT_FOUND, 404, 'User not found');

    return successResponse({ user: sanitizeUser(user) });
  }

  // ----- PATCH /auth/profile -----
  if (path === '/auth/profile' && method === 'PATCH') {
    const userToken = request.headers.get('X-User-Token');
    if (!userToken) return errorResponse(ErrorCodes.AUTH_REQUIRED, 401, 'Token required');

    const verified = await verifyHomaToken(userToken, env);
    if (!verified) return errorResponse(ErrorCodes.AUTH_REQUIRED, 401, 'Invalid or expired token');

    let body;
    try { body = await request.json(); } catch { return errorResponse(ErrorCodes.INVALID_INPUT); }

    // Only allow updating safe fields
    const allowedFields = ['full_name', 'memory', 'default_model', 'onboarding_completed', 'referral_source'];
    const updates = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (Object.keys(updates).length === 0) return errorResponse(ErrorCodes.INVALID_INPUT, 400, 'No updatable fields');

    if (!env.DB) return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, 'Database not configured');
    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const binds = [...Object.values(updates), verified.userId];
    try {
      await env.DB.prepare(`UPDATE users SET ${setClauses}, updated_at = datetime('now') WHERE id = ?`).bind(...binds).run();
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }

    const user = await getUserById(env, verified.userId);
    return successResponse({ user: sanitizeUser(user) });
  }

  // ----- POST /auth/reset-request -----
  if (path === '/auth/reset-request' && method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return errorResponse(ErrorCodes.INVALID_INPUT); }
    const email = (body.email || '').trim().toLowerCase();

    // Rate limit: 3 reset requests per hour per IP+email
    const ip = getClientIp(request);
    if (!checkRateLimit('reset_req:' + ip + ':' + email, 3, 60 * 60 * 1000)) {
      return errorResponse('RATE_LIMITED', 429, 'تلاش‌های زیاد. بعداً دوباره تلاش کنید');
    }

    if (!env.DB) return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, 'Database not configured');
    const user = await getUserByEmail(env, email);
    // Always return success — don't reveal if email exists
    if (!user) return successResponse({ sent: true });

    const resetToken = generateResetToken();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    try {
      await env.DB.prepare('UPDATE users SET reset_token = ?, reset_expires_at = ? WHERE id = ?')
        .bind(resetToken, resetExpiry, user.id).run();
    } catch {}

    await sendResetEmail(env, email, resetToken);
    return successResponse({ sent: true });
  }

  // ----- POST /auth/reset -----
  if (path === '/auth/reset' && method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return errorResponse(ErrorCodes.INVALID_INPUT); }
    const token = (body.token || '').trim();
    const newPassword = body.new_password || '';

    if (!token || newPassword.length < 6) return errorResponse(ErrorCodes.INVALID_INPUT, 400, 'رمز عبور حداقل ۶ کاراکتر');

    // Rate limit: 5 reset attempts per hour per IP
    const ip = getClientIp(request);
    if (!checkRateLimit('reset:' + ip, 5, 60 * 60 * 1000)) {
      return errorResponse('RATE_LIMITED', 429, 'تلاش‌های زیاد. بعداً دوباره تلاش کنید');
    }

    if (!env.DB) return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, 'Database not configured');

    let user;
    try {
      user = await env.DB.prepare('SELECT * FROM users WHERE reset_token = ?').bind(token).first();
    } catch {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, 'Database error');
    }
    if (!user) return errorResponse(ErrorCodes.INVALID_INPUT, 400, 'لینک بازیابی نامعتبر');
    if (user.reset_expires_at && new Date(user.reset_expires_at) < new Date()) return errorResponse(ErrorCodes.INVALID_INPUT, 400, 'لینک بازیابی منقضی شده');

    const passwordHash = await hashPassword(newPassword);
    try {
      await env.DB.prepare('UPDATE users SET password_hash = ?, reset_token = ?, reset_expires_at = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .bind(passwordHash, '', '', user.id).run();
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }

    return successResponse({ success: true });
  }

  return errorResponse(ErrorCodes.NOT_FOUND);
}
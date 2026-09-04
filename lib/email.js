/**
 * Homa AI — Email Abstraction (B9, B23)
 *
 * Provider: Resend (when RESEND_API_KEY is set as Worker secret)
 * If no provider is configured, returns { error: 'NO_EMAIL_PROVIDER' }.
 * NEVER fakes email sending. NEVER returns success without actually sending.
 */

import { ErrorCodes } from './errors.js';

const RESEND_API = 'https://api.resend.com/emails';

async function resendSend(env, { to, subject, html, from_name }) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return { error: ErrorCodes.NO_EMAIL_PROVIDER };
  const from = (env.MAIL_FROM || 'Homa AI <noreply@homa.ai>');
  const senderName = from_name ? `Homa AI <${from_name}>` : from;
  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: senderName, to: [to], subject, html: html || subject }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { error: 'EMAIL_SEND_FAILED', status: res.status, detail: errText };
    }
    const data = await res.json().catch(() => ({}));
    return { ok: true, id: data.id || '' };
  } catch (e) {
    return { error: 'EMAIL_NETWORK_ERROR', message: e.message };
  }
}

function verificationTemplate(code) {
  return `<div dir="rtl" style="font-family: Vazirmatn, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;"><h2 style="color: #1e2538;">هُما AI — تأیید ایمیل</h2><p>کد تأیید شما:</p><div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb; padding: 16px; background: #f0f4ff; border-radius: 12px; text-align: center; margin: 16px 0;">${code}</div><p style="color: #666; font-size: 14px;">این کد تا ۱۰ دقیقه معتبر است.</p></div>`;
}

function passwordResetTemplate(link) {
  return `<div dir="rtl" style="font-family: Vazirmatn, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;"><h2 style="color: #1e2538;">هُما AI — بازنشانی رمز عبور</h2><p>برای بازنشانی رمز عبور روی لینک زیر کلیک کنید:</p><a href="${link}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">بازنشانی رمز عبور</a></div>`;
}

function receiptTemplate(order) {
  return `<div dir="rtl" style="font-family: Vazirmatn, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;"><h2 style="color: #1e2538;">هُما AI — رسید پرداخت</h2><table style="width: 100%; border-collapse: collapse; margin: 16px 0;"><tr><td style="padding: 8px; border: 1px solid #eee;">شناسه سفارش:</td><td style="padding: 8px; border: 1px solid #eee;">${order.id || ''}</td></tr><tr><td style="padding: 8px; border: 1px solid #eee;">طرح:</td><td style="padding: 8px; border: 1px solid #eee;">${order.plan || ''}</td></tr><tr><td style="padding: 8px; border: 1px solid #eee;">مبلغ:</td><td style="padding: 8px; border: 1px solid #eee;">${order.amount || 0} تومان</td></tr><tr><td style="padding: 8px; border: 1px solid #eee;">اعتبار:</td><td style="padding: 8px; border: 1px solid #eee;">${order.credits || 0}</td></tr></table></div>`;
}

function supportNotificationTemplate(ticket) {
  return `<div dir="rtl" style="font-family: Vazirmatn, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;"><h2 style="color: #1e2538;">هُما AI — تیکت پشتیبانی</h2><p><strong>موضوع:</strong> ${ticket.subject || ''}</p><p><strong>پیام:</strong></p><div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">${ticket.message || ''}</div></div>`;
}

export const email = {
  isAvailable(env) { return !!env.RESEND_API_KEY; },
  async send(env, opts) { return await resendSend(env, opts); },
  async sendVerification(env, { to, code }) { return await resendSend(env, { to, subject: 'کد تأیید هُما AI', html: verificationTemplate(code) }); },
  async sendPasswordReset(env, { to, link }) { return await resendSend(env, { to, subject: 'بازنشانی رمز عبور — هُما AI', html: passwordResetTemplate(link) }); },
  async sendReceipt(env, { to, order }) { return await resendSend(env, { to, subject: 'رسید پرداخت — هُما AI', html: receiptTemplate(order) }); },
  async sendSupportNotification(env, { to, ticket }) { return await resendSend(env, { to, subject: 'تیکت پشتیبانی جدید — هُما AI', html: supportNotificationTemplate(ticket) }); },
};
/**
 * Homa AI — Payment Routes (B11)
 * Payments are NEVER confirmed without gateway verification.
 * On success: verify → update order → grant credits (atomic, idempotent).
 */
import { requireAuth } from '../lib/auth.js';
import { successResponse, errorResponse, ErrorCodes } from '../lib/errors.js';
import { payments } from '../lib/payments.js';

export async function handlePaymentRoutes(request, env, url, user) {
  const path = url.pathname;
  const method = request.method;
  if (!env.DB) return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, 'Database not configured');

  if (path === '/payments/create' && method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return errorResponse(ErrorCodes.INVALID_INPUT); }
    const { amount, plan, credits, description } = body;
    if (!amount || !plan || !credits) return errorResponse(ErrorCodes.INVALID_INPUT, 400, 'مبلغ، طرح و اعتبار الزامی است.');
    if (!payments.isAvailable(env)) return errorResponse(ErrorCodes.NO_PAYMENT_PROVIDER);
    const orderResult = await payments.createOrder(env, { userId: user.id, amount, plan, credits, description: description || '' });
    if (orderResult.error) return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, orderResult.error);
    const callbackUrl = (env.WORKER_URL || url.origin) + '/payments/zarinpal/callback?order_id=' + orderResult.id;
    const payResult = await payments.createPayment(env, { amount, description: description || 'Homa AI - ' + plan, callback_url: callbackUrl });
    if (payResult.error) return errorResponse(payResult.error, undefined, payResult.detail || payResult.message);
    try { await env.DB.prepare('UPDATE orders SET authority = ? WHERE id = ?').bind(payResult.authority, orderResult.id).run(); } catch {}
    return successResponse({ order_id: orderResult.id, redirect_url: payResult.redirect_url, authority: payResult.authority });
  }

  if (path === '/payments/zarinpal/callback' && method === 'GET') {
    const authority = url.searchParams.get('Authority') || url.searchParams.get('authority');
    const status = url.searchParams.get('Status') || url.searchParams.get('status');
    const orderId = url.searchParams.get('order_id');
    if (!authority || !orderId) return errorResponse(ErrorCodes.INVALID_INPUT, 400, 'پارامترهای callback نامعتبر.');
    if (status !== 'OK' && status !== 'ok') {
      try { await env.DB.prepare('UPDATE orders SET status = ? WHERE id = ?').bind('cancelled', orderId).run(); } catch {}
      return errorResponse(ErrorCodes.PAYMENT_FAILED, 400, 'پرداخت توسط کاربر لغو شد.');
    }
    try {
      const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first();
      if (!order) return errorResponse(ErrorCodes.NOT_FOUND, 404, 'سفارش یافت نشد.');
      const verifyResult = await payments.verifyPayment(env, { authority, amount: order.amount });
      if (verifyResult.error) {
        await env.DB.prepare('UPDATE orders SET status = ? WHERE id = ?').bind('failed', orderId).run();
        return errorResponse(ErrorCodes.PAYMENT_FAILED, undefined, verifyResult.detail || verifyResult.message);
      }
      const completeResult = await payments.completeOrder(env, orderId, verifyResult.ref_id);
      if (completeResult.error) return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, completeResult.error);
      const appUrl = env.APP_URL || 'https://homa.ai';
      return Response.redirect(appUrl + '/credits?paid=' + orderId, 302);
    } catch (e) { return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message); }
  }

  const statusMatch = path.match(/^\/payments\/status\/([^/]+)$/);
  if (statusMatch && method === 'GET') {
    const orderId = decodeURIComponent(statusMatch[1]);
    try {
      const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').bind(orderId, user.id).first();
      if (!order) return errorResponse(ErrorCodes.NOT_FOUND);
      return successResponse({ order_id: order.id, status: order.status, amount: order.amount, plan: order.plan, credits: order.credits, ref_id: order.ref_id, credits_added: order.credits_added });
    } catch (e) { return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message); }
  }

  return errorResponse(ErrorCodes.NOT_FOUND);
}
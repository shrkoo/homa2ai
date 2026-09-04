/**
 * Homa AI — Admin Routes (B8)
 * All admin endpoints require admin role validation in the Worker (requireAdmin).
 * Admin role is NEVER trusted from the frontend alone — always validated in D1.
 */
import { requireAdmin } from '../lib/auth.js';
import { successResponse, errorResponse, ErrorCodes } from '../lib/errors.js';

export async function handleAdminRoutes(request, env, url) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  if (!auth.isAdmin) return errorResponse(ErrorCodes.FORBIDDEN);

  const path = url.pathname;
  const method = request.method;
  if (!env.DB) return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, 'Database not configured');

  if (path === '/admin/dashboard' && method === 'GET') {
    try {
      const userCount = await env.DB.prepare('SELECT COUNT(*) as c FROM users').first();
      const orderCount = await env.DB.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'paid'").first();
      const ticketCount = await env.DB.prepare("SELECT COUNT(*) as c FROM support_tickets WHERE status = 'open'").first();
      const totalCredits = await env.DB.prepare('SELECT SUM(credits) as c FROM usage').first();
      const totalRevenue = await env.DB.prepare("SELECT SUM(amount) as c FROM orders WHERE status = 'paid'").first();
      return successResponse({ users: userCount?.c || 0, paid_orders: orderCount?.c || 0, open_tickets: ticketCount?.c || 0, total_credits: totalCredits?.c || 0, total_revenue: totalRevenue?.c || 0 });
    } catch (e) { return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message); }
  }

  if (path === '/admin/users' && method === 'GET') {
    try {
      const { results } = await env.DB.prepare('SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC LIMIT 200').all();
      return successResponse({ users: results || [] });
    } catch (e) { return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message); }
  }

  const userMatch = path.match(/^\/admin\/users\/([^/]+)$/);
  if (userMatch && method === 'PATCH') {
    const userId = decodeURIComponent(userMatch[1]);
    let body;
    try { body = await request.json(); } catch { return errorResponse(ErrorCodes.INVALID_INPUT); }
    const allowedFields = ['role', 'display_name', 'onboarding_completed', 'default_model', 'memory'];
    const updates = {};
    for (const f of allowedFields) { if (body[f] !== undefined) updates[f] = body[f]; }
    const cols = Object.keys(updates);
    if (cols.length === 0) return errorResponse(ErrorCodes.INVALID_INPUT, 400, 'هیچ فیلد معتبری برای به‌روزرسانی وجود ندارد.');
    const sets = cols.map(c => `${c} = ?`).join(', ');
    const vals = cols.map(c => updates[c]);
    try {
      await env.DB.prepare(`UPDATE users SET ${sets}, updated_at = ? WHERE id = ?`).bind(...vals, new Date().toISOString(), userId).run();
      return successResponse({ updated: true });
    } catch (e) { return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message); }
  }

  if (path === '/admin/orders' && method === 'GET') {
    try {
      const { results } = await env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200').all();
      return successResponse({ orders: results || [] });
    } catch (e) { return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message); }
  }

  if (path === '/admin/tickets' && method === 'GET') {
    try {
      const { results } = await env.DB.prepare('SELECT * FROM support_tickets ORDER BY created_at DESC LIMIT 200').all();
      return successResponse({ tickets: results || [] });
    } catch (e) { return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message); }
  }

  const ticketMatch = path.match(/^\/admin\/tickets\/([^/]+)$/);
  if (ticketMatch && method === 'PATCH') {
    const ticketId = decodeURIComponent(ticketMatch[1]);
    let body;
    try { body = await request.json(); } catch { return errorResponse(ErrorCodes.INVALID_INPUT); }
    const allowedFields = ['status', 'priority'];
    const updates = {};
    for (const f of allowedFields) { if (body[f] !== undefined) updates[f] = body[f]; }
    const cols = Object.keys(updates);
    if (cols.length === 0) return errorResponse(ErrorCodes.INVALID_INPUT);
    const sets = cols.map(c => `${c} = ?`).join(', ');
    const vals = cols.map(c => updates[c]);
    try {
      await env.DB.prepare(`UPDATE support_tickets SET ${sets}, updated_at = ? WHERE id = ?`).bind(...vals, new Date().toISOString(), ticketId).run();
      return successResponse({ updated: true });
    } catch (e) { return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message); }
  }

  if (path === '/admin/provider-health' && method === 'GET') {
    const { router } = await import('../providers/router.js');
    const capabilities = ['chat', 'reasoning', 'coding', 'vision', 'image', 'image_edit', 'video', 'stt', 'tts', 'file_analysis', 'web_search', 'deep_research'];
    const health = {};
    for (const cap of capabilities) health[cap] = { available: router.isAvailable(cap, env), providers: router.getProviders(cap, env) };
    return successResponse(health);
  }

  if (path === '/admin/credits/transactions' && method === 'GET') {
    try {
      const { results } = await env.DB.prepare('SELECT * FROM credit_transactions ORDER BY created_at DESC LIMIT 200').all();
      return successResponse({ transactions: results || [] });
    } catch (e) { return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message); }
  }

  return errorResponse(ErrorCodes.NOT_FOUND);
}
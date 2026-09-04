/**
 * Homa AI — Support Ticket Routes (B9)
 * User can only access their own tickets. Admin accesses all (via requireAdmin).
 */
import { requireAdmin } from '../lib/auth.js';
import { successResponse, errorResponse, ErrorCodes } from '../lib/errors.js';
import { email } from '../lib/email.js';

export async function handleSupportRoutes(request, env, url, user) {
  const path = url.pathname;
  const method = request.method;
  if (!env.DB) return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, 'Database not configured');

  if (path === '/support/tickets' && method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return errorResponse(ErrorCodes.INVALID_INPUT); }
    if (!body.subject || !body.message) return errorResponse(ErrorCodes.INVALID_INPUT, 400, 'موضوع و پیام الزامی است.');
    const id = 'ticket_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    try {
      await env.DB.prepare(
        'INSERT INTO support_tickets (id, user_id, subject, message, user_email, user_name, status, priority, replies) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(id, user.id, body.subject, body.message, body.user_email || '', body.user_name || '', 'open', body.priority || 'normal', '[]').run();
    } catch (e) { return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message); }
    if (email.isAvailable(env)) {
      email.sendSupportNotification(env, { to: env.ADMIN_EMAIL || 'support@homa.ai', ticket: { subject: body.subject, message: body.message, status: 'open' } }).catch(() => {});
    }
    return successResponse({ id, status: 'open' });
  }

  if (path === '/support/tickets' && method === 'GET') {
    try {
      const { results } = await env.DB.prepare('SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC').bind(user.id).all();
      return successResponse({ tickets: results || [] });
    } catch (e) { return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message); }
  }

  const ticketMatch = path.match(/^\/support\/tickets\/([^/]+)$/);
  if (ticketMatch && method === 'GET') {
    const ticketId = decodeURIComponent(ticketMatch[1]);
    try {
      const ticket = await env.DB.prepare('SELECT * FROM support_tickets WHERE id = ? AND user_id = ?').bind(ticketId, user.id).first();
      if (!ticket) return errorResponse(ErrorCodes.NOT_FOUND);
      return successResponse(ticket);
    } catch (e) { return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message); }
  }

  const replyMatch = path.match(/^\/support\/tickets\/([^/]+)\/reply$/);
  if (replyMatch && method === 'POST') {
    const ticketId = decodeURIComponent(replyMatch[1]);
    let body;
    try { body = await request.json(); } catch { return errorResponse(ErrorCodes.INVALID_INPUT); }
    if (!body.content) return errorResponse(ErrorCodes.INVALID_INPUT, 400, 'محتوای پاسخ الزامی است.');
    try {
      const ticket = await env.DB.prepare('SELECT * FROM support_tickets WHERE id = ? AND user_id = ?').bind(ticketId, user.id).first();
      if (!ticket) return errorResponse(ErrorCodes.NOT_FOUND);
      const replies = JSON.parse(ticket.replies || '[]');
      replies.push({ content: body.content, by_admin: false, author_name: body.author_name || '', created_at: new Date().toISOString() });
      await env.DB.prepare('UPDATE support_tickets SET replies = ?, status = ?, updated_at = ? WHERE id = ?')
        .bind(JSON.stringify(replies), 'open', new Date().toISOString(), ticketId).run();
      return successResponse({ reply_added: true });
    } catch (e) { return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message); }
  }

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
      await env.DB.prepare(`UPDATE support_tickets SET ${sets}, updated_at = ? WHERE id = ? AND user_id = ?`).bind(...vals, new Date().toISOString(), ticketId, user.id).run();
      return successResponse({ updated: true });
    } catch (e) { return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message); }
  }

  const adminReplyMatch = path.match(/^\/support\/tickets\/([^/]+)\/admin-reply$/);
  if (adminReplyMatch && method === 'POST') {
    const adminAuth = await requireAdmin(request, env);
    if (adminAuth.error) return adminAuth.error;
    if (!adminAuth.isAdmin) return errorResponse(ErrorCodes.FORBIDDEN);
    const ticketId = decodeURIComponent(adminReplyMatch[1]);
    let body;
    try { body = await request.json(); } catch { return errorResponse(ErrorCodes.INVALID_INPUT); }
    if (!body.content) return errorResponse(ErrorCodes.INVALID_INPUT, 400, 'محتوای پاسخ الزامی است.');
    try {
      const ticket = await env.DB.prepare('SELECT * FROM support_tickets WHERE id = ?').bind(ticketId).first();
      if (!ticket) return errorResponse(ErrorCodes.NOT_FOUND);
      const replies = JSON.parse(ticket.replies || '[]');
      replies.push({ content: body.content, by_admin: true, author_name: body.author_name || 'پشتیبانی هُما', created_at: new Date().toISOString() });
      await env.DB.prepare('UPDATE support_tickets SET replies = ?, status = ?, updated_at = ? WHERE id = ?')
        .bind(JSON.stringify(replies), body.status || 'in_progress', new Date().toISOString(), ticketId).run();
      if (email.isAvailable(env) && ticket.user_email) {
        email.send(env, { to: ticket.user_email, subject: 'پاسخ به تیکت پشتیبانی — هُما AI', html: `<div dir="rtl" style="font-family: sans-serif; padding: 20px;"><h2>پاسخ به تیکت شما</h2><p><strong>موضوع:</strong> ${ticket.subject}</p><div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">${body.content}</div></div>` }).catch(() => {});
      }
      return successResponse({ reply_added: true });
    } catch (e) { return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message); }
  }

  return errorResponse(ErrorCodes.NOT_FOUND);
}
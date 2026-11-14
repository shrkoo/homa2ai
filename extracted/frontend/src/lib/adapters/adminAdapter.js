/**
 * adminAdapter.js — Admin operations (Worker-backed, no Base44).
 */

import { invokeFunctionDirect } from '@/lib/directInvoke';

export const adminAdapter = {
  async getDashboard({ section = 'summary' } = {}) {
    const routes = {
      summary: 'adminDashboard',
      referral: 'adminReferrals',
      orders: 'adminOrders',
      users: 'adminUsers',
      usage: 'adminCreditTransactions',
      requests: 'apiUsage',
      tickets: 'adminListTickets',
    };
    const route = routes[section];
    if (!route) throw new Error('این بخش هنوز در Worker فعلی API مدیریتی ندارد.');
    const response = await invokeFunctionDirect(route, section === 'tickets' ? { status: 'all' } : {});
    const data = response?.data || response;
    if (section === 'requests') {
      return { ...response, data: { requests: (data.usage || []).map((item) => ({ ...item, created_date: item.created_at, credits_used: item.credits })) } };
    }
    if (section === 'referral') {
      return { ...response, data: { referral: {
        total: data.total_referrals || 0,
        sources: [
          { key: 'rewarded', label: 'دعوت‌های پاداش‌گرفته', count: data.rewarded_referrals || 0 },
          { key: 'pending', label: 'دعوت‌های در انتظار', count: data.pending_referrals || 0 },
          { key: 'referrers', label: 'معرف‌های فعال', count: data.active_referrers || 0 },
          { key: 'monthly', label: 'دعوت‌های این ماه', count: data.monthly_referrals || 0 },
          { key: 'credits', label: 'اعتبار اعطاشده', count: data.total_credits_awarded || 0 },
        ],
        conversion_rate: data.conversion_rate || 0,
        top_referrers: data.top_referrers || [],
      } } };
    }
    return response;
  },

  async manageUser(data) {
    return invokeFunctionDirect('adminManageUser', data);
  },

  async listTickets(status) {
    return invokeFunctionDirect('adminListTickets', { status });
  },

  async updateTicket(ticketId, data) {
    return invokeFunctionDirect('adminUpdateTicket', { ticket_id: ticketId, ...data });
  },

  async getProviderHealth() {
    return invokeFunctionDirect('homaApiHealth', { detail: 'providers' });
  },
};

export default adminAdapter;
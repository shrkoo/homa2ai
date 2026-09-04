/**
 * adminAdapter.js — Admin operations (Worker-backed, no Base44).
 */

import { invokeFunctionDirect } from '@/lib/directInvoke';

export const adminAdapter = {
  async getDashboard(data = {}) {
    return invokeFunctionDirect('adminDashboard', data);
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
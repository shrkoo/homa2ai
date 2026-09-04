/**
 * supportAdapter.js — Support ticket operations (Worker-backed, no Base44).
 */

import { entities } from '@/lib/dataStore';
import { invokeFunctionDirect } from '@/lib/directInvoke';

export const supportAdapter = {
  async createTicket(data) {
    return invokeFunctionDirect('createTicket', data);
  },

  async listMyTickets() {
    return entities.SupportTicket.list('-created_date', 50);
  },

  async getTicket(id) {
    return entities.SupportTicket.get(id);
  },

  async replyTicket(data) {
    return invokeFunctionDirect('replyTicket', data);
  },

  async updateTicketStatus(id, status) {
    return entities.SupportTicket.update(id, { status });
  },

  async adminListTickets(data = {}) {
    return invokeFunctionDirect('adminListTickets', data);
  },

  async adminUpdateTicket(data) {
    return invokeFunctionDirect('adminUpdateTicket', data);
  },
};

export default supportAdapter;
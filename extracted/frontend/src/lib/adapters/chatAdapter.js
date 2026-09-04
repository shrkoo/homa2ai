/**
 * chatAdapter.js — Conversation & Message data access (B4).
 *
 * All chat persistence goes through this adapter. It uses dataStore
 * (Worker D1 first, Base44 fallback) so the frontend never touches
 * Base44 or SQL directly.
 *
 * When Worker is configured → D1. When not → Base44 (dual-run).
 */

import { entities } from '@/lib/dataStore';
import { invokeFunctionDirect } from '@/lib/directInvoke';

export const chatAdapter = {
  // ── Conversations ──────────────────────────────────────────

  async listConversations(sort = '-updated_date', limit = 100) {
    return entities.Conversation.list(sort, limit);
  },

  async getConversation(id) {
    return entities.Conversation.get(id);
  },

  async createConversation(data = {}) {
    return entities.Conversation.create({
      title: data.title || 'گفتگوی جدید',
      language: data.language || 'fa',
      model: data.model || 'auto',
      temporary: data.temporary ?? false,
      archived: false,
      folder_id: data.folder_id || '',
    });
  },

  async updateConversation(id, data) {
    return entities.Conversation.update(id, data);
  },

  async updateTitle(id, title) {
    return entities.Conversation.update(id, { title });
  },

  async updateLastMessage(id, lastMessage) {
    return entities.Conversation.update(id, { last_message: lastMessage });
  },

  async archiveConversation(id, archived = true) {
    return entities.Conversation.update(id, { archived });
  },

  async setTemporary(id, temporary = true) {
    return entities.Conversation.update(id, { temporary });
  },

  async moveToFolder(id, folderId) {
    return entities.Conversation.update(id, { folder_id: folderId });
  },

  async deleteConversation(id) {
    return entities.Conversation.delete(id);
  },

  async searchConversations(query) {
    // Worker supports query filters; Base44 filter does too
    return entities.Conversation.filter({ title: { $regex: query } }, '-updated_date', 50);
  },

  // ── Messages ────────────────────────────────────────────────

  async listMessages(conversationId, sort = 'created_date', limit = 200) {
    return entities.Message.filter({ conversation_id: conversationId }, sort, limit);
  },

  async createMessage(data) {
    return entities.Message.create({
      conversation_id: data.conversation_id,
      role: data.role,
      content: data.content,
      model: data.model || '',
      ...data.extra,
    });
  },

  async updateMessage(id, data) {
    return entities.Message.update(id, data);
  },

  async deleteMessage(id) {
    return entities.Message.delete(id);
  },

  async deleteMessagesByConversation(conversationId) {
    return entities.Message.deleteMany({ conversation_id: conversationId });
  },

  async deleteMessages(messageIds) {
    if (!Array.isArray(messageIds) || messageIds.length === 0) return { count: 0 };
    return entities.Message.deleteMany({ id: { $in: messageIds } });
  },

  // ── Folders ─────────────────────────────────────────────────

  async listFolders(sort = 'sort') {
    return entities.ChatFolder.list(sort, 100);
  },

  async createFolder(name, color = '217 91% 60%', sort = 0) {
    return entities.ChatFolder.create({ name, color, sort });
  },

  async updateFolder(id, data) {
    return entities.ChatFolder.update(id, data);
  },

  async deleteFolder(id) {
    return entities.ChatFolder.delete(id);
  },

  // ── Bulk / Maintenance ─────────────────────────────────────

  async filterConversations(query, sort = '-updated_date', limit = 100) {
    return entities.Conversation.filter(query, sort, limit);
  },

  async deleteManyConversations(query) {
    return entities.Conversation.deleteMany(query);
  },

  async deleteManyMessages(query) {
    return entities.Message.deleteMany(query);
  },

  async archiveOldConversations() {
    return invokeFunctionDirect('archiveOldConversations', {});
  },
};

export default chatAdapter;
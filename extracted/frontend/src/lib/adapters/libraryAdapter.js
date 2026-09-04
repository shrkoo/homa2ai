/**
 * libraryAdapter.js — Library item & favorites operations (B23/B16).
 */

import { entities } from '@/lib/dataStore';

export const libraryAdapter = {
  // ── Library Items ──────────────────────────────────────────

  async listLibrary(sort = '-created_date', limit = 100) {
    return entities.LibraryItem.list(sort, limit);
  },

  async listByKind(kind, limit = 50) {
    return entities.LibraryItem.filter({ kind }, '-created_date', limit);
  },

  async createLibraryItem(data) {
    return entities.LibraryItem.create(data);
  },

  async updateLibraryItem(id, data) {
    return entities.LibraryItem.update(id, data);
  },

  async deleteLibraryItem(id) {
    return entities.LibraryItem.delete(id);
  },

  // ── Favorites ──────────────────────────────────────────────

  async listFavorites(limit = 100) {
    return entities.Favorite.list('-created_date', limit);
  },

  async createFavorite(data) {
    return entities.Favorite.create(data);
  },

  async deleteFavorite(id) {
    return entities.Favorite.delete(id);
  },

  // ── Favorite Stores ────────────────────────────────────────

  async listFavoriteStores() {
    return entities.FavoriteStore.list('name', 100);
  },

  async createFavoriteStore(data) {
    return entities.FavoriteStore.create(data);
  },

  async deleteFavoriteStore(id) {
    return entities.FavoriteStore.delete(id);
  },

  // ── Shopping Lists ─────────────────────────────────────────

  async listShoppingLists() {
    return entities.ShoppingList.list('-created_date', 50);
  },

  async createShoppingList(name, items = []) {
    return entities.ShoppingList.create({ name, items });
  },

  async updateShoppingList(id, data) {
    return entities.ShoppingList.update(id, data);
  },

  async deleteShoppingList(id) {
    return entities.ShoppingList.delete(id);
  },

  // ── Prompt Templates ───────────────────────────────────────

  async listPromptTemplates() {
    return entities.PromptTemplate.list('-updated_date', 100);
  },

  async createPromptTemplate(data) {
    return entities.PromptTemplate.create(data);
  },

  async updatePromptTemplate(id, data) {
    return entities.PromptTemplate.update(id, data);
  },

  async deletePromptTemplate(id) {
    return entities.PromptTemplate.delete(id);
  },
};

export default libraryAdapter;
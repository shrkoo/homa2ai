/**
 * dataAdapter.js — Generic entity data access (B16).
 *
 * Re-exports dataStore entities with a clean, typed interface.
 * Components import from here, never from dataStore or base44 directly.
 */

import { entities, isWorkerReady } from '@/lib/dataStore';

export const dataAdapter = {
  entities,
  isWorkerReady,

  // Generic helpers
  async list(entityName, sort, limit) {
    return entities[entityName].list(sort, limit);
  },

  async filter(entityName, query, sort, limit) {
    return entities[entityName].filter(query, sort, limit);
  },

  async get(entityName, id) {
    return entities[entityName].get(id);
  },

  async create(entityName, data) {
    return entities[entityName].create(data);
  },

  async update(entityName, id, data) {
    return entities[entityName].update(id, data);
  },

  async delete(entityName, id) {
    return entities[entityName].delete(id);
  },

  async deleteMany(entityName, query) {
    return entities[entityName].deleteMany(query);
  },

  async bulkCreate(entityName, records) {
    return entities[entityName].bulkCreate(records);
  },

  async bulkUpdate(entityName, records) {
    return entities[entityName].bulkUpdate(records);
  },

  async updateMany(entityName, query, update) {
    return entities[entityName].updateMany(query, update);
  },

  async schema(entityName) {
    return entities[entityName].schema();
  },
};

export default dataAdapter;
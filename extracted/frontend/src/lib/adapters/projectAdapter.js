/**
 * projectAdapter.js — Project operations (B23/B16).
 */

import { entities } from '@/lib/dataStore';

export const projectAdapter = {
  async listProjects(sort = '-updated_date', limit = 100) {
    return entities.Project.list(sort, limit);
  },

  async getProject(id) {
    return entities.Project.get(id);
  },

  async createProject(data) {
    return entities.Project.create(data);
  },

  async updateProject(id, data) {
    return entities.Project.update(id, data);
  },

  async deleteProject(id) {
    return entities.Project.delete(id);
  },
};

export default projectAdapter;
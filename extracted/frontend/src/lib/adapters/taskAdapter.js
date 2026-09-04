/**
 * taskAdapter.js — Task operations (B23/B16).
 */

import { entities } from '@/lib/dataStore';

export const taskAdapter = {
  async listTasks(query, sort = '-updated_date', limit = 100) {
    if (query) return entities.Task.filter(query, sort, limit);
    return entities.Task.list(sort, limit);
  },

  async getTask(id) {
    return entities.Task.get(id);
  },

  async createTask(data) {
    return entities.Task.create(data);
  },

  async updateTask(id, data) {
    return entities.Task.update(id, data);
  },

  async deleteTask(id) {
    return entities.Task.delete(id);
  },

  async bulkUpdateTasks(records) {
    return entities.Task.bulkUpdate(records);
  },

  async deleteTasksByProject(projectId) {
    return entities.Task.deleteMany({ project_id: projectId });
  },
};

export default taskAdapter;
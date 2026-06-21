import api from './axios'

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  changePassword: (data) => api.post('/auth/change-password', data),
}

// Users
export const userAPI = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  toggleActive: (id, active) => api.patch(`/users/${id}/activate`, null, { params: { active } }),
}

// Projects
export const projectAPI = {
  create: (data) => api.post('/projects', data),
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  archive: (id) => api.patch(`/projects/${id}/archive`),
  search: (q, params) => api.get('/projects/search', { params: { q, ...params } }),
  getByStatus: (status, params) => api.get(`/projects/status/${status}`, { params }),
  getMine: (params) => api.get('/projects/my', { params }),
  updateProgress: (id, progress) => api.patch(`/projects/${id}/progress`, null, { params: { progress } }),
}

// Tasks
export const taskAPI = {
  create: (data) => api.post('/tasks', data),
  getById: (id) => api.get(`/tasks/${id}`),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  getByProject: (projectId, params) => api.get(`/tasks/project/${projectId}`, { params }),
  getMine: (params) => api.get('/tasks/my', { params }),
  search: (q, params) => api.get('/tasks/search', { params: { q, ...params } }),
  move: (data) => api.patch('/tasks/move', data),
  getKanban: (projectId) => api.get(`/tasks/kanban/${projectId}`),
}

// Teams
export const teamAPI = {
  create: (data) => api.post('/teams', data),
  getAll: (params) => api.get('/teams', { params }),
  getById: (id) => api.get(`/teams/${id}`),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
  addMember: (teamId, userId) => api.post(`/teams/${teamId}/members/${userId}`),
  removeMember: (teamId, userId) => api.delete(`/teams/${teamId}/members/${userId}`),
  assignManager: (teamId, userId) => api.patch(`/teams/${teamId}/manager/${userId}`),
  getMine: (params) => api.get('/teams/my', { params }),
  search: (q, params) => api.get('/teams/search', { params: { q, ...params } }),
}

// Comments
export const commentAPI = {
  add: (taskId, data) => api.post(`/tasks/${taskId}/comments`, data),
  getByTask: (taskId, params) => api.get(`/tasks/${taskId}/comments`, { params }),
  update: (taskId, id, data) => api.put(`/tasks/${taskId}/comments/${id}`, data),
  delete: (taskId, id) => api.delete(`/tasks/${taskId}/comments/${id}`),
}

// Notifications
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
}

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
}

// Activity Logs
export const activityAPI = {
  getAll: (params) => api.get('/activity-logs', { params }),
  getMine: (params) => api.get('/activity-logs/me', { params }),
  getByProject: (projectId, params) => api.get(`/activity-logs/project/${projectId}`, { params }),
}

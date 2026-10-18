import axios from 'axios';

const configuredApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

if (!configuredApiUrl) {
  throw new Error('Missing VITE_API_URL. Please define it in your frontend environment variables.');
}

const API_BASE_URL = configuredApiUrl.endsWith('/api')
  ? configuredApiUrl
  : `${configuredApiUrl}/api`;
  
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Refresh short-lived access cookies without exposing JWTs to browser storage.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const authPath = /^\/auth\/(login|register|forgot-password|reset-password|refresh-token|logout)/.test(originalRequest?.url || '');
    if (error.response?.status === 401 && !authPath && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, { withCredentials: true });
        return api(originalRequest);
      } catch (refreshError) { return Promise.reject(refreshError); }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  updateProfile: (data) => api.put('/auth/profile', data),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
};

// Course API
export const courseAPI = {
  getAllCourses: (params) => api.get('/courses', { params }),
  getCourseById: (id) => api.get(`/courses/${id}`),
  searchCourses: (params) => api.get('/courses/search', { params }),
  createCourse: (data) => api.post('/courses', data),
  updateCourse: (id, data) => api.put(`/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  getInstructorCourses: () => api.get('/courses/instructor/my-courses'),
  uploadThumbnail: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('thumbnail', file);
    return api.post('/courses/upload/thumbnail', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },
  uploadIntroVideo: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('video', file);
    return api.post('/courses/upload/intro-video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },
};

// Module API
export const moduleAPI = {
  getModule: (id) => api.get(`/modules/${id}`),
  getCourseModules: (courseId) => api.get(`/modules/course/${courseId}/all`),
  createModule: (data) => api.post('/modules', data),
  updateModule: (id, data) => api.put(`/modules/${id}`, data),
  deleteModule: (id) => api.delete(`/modules/${id}`),
  reorderModules: (data) => api.put('/modules/reorder/all', data),
};

// Lesson API
export const lessonAPI = {
  getLesson: (id) => api.get(`/lessons/${id}`),
  getStream: (id) => api.get(`/lessons/${id}/stream`),
  getModuleLessons: (moduleId) => api.get(`/lessons/module/${moduleId}/all`),
  createLesson: (data) => api.post('/lessons', data),
  updateLesson: (id, data) => api.put(`/lessons/${id}`, data),
  deleteLesson: (id) => api.delete(`/lessons/${id}`),
  addResources: (id, data) => api.post(`/lessons/${id}/resources`, data),
  removeResource: (id, data) => api.delete(`/lessons/${id}/resource`, { data }),
  uploadLessonVideo: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('video', file);
    return api.post('/lessons/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },
  uploadLessonResource: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('resource', file);
    return api.post('/lessons/upload/resource', formData, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress });
  },
  reorderLessons: (data) => api.put('/lessons/reorder/all', data),
};

// Order API
export const orderAPI = {
  enrollFree: (courseId) => api.post('/orders/free-enroll', { courseId }),
  getUserOrders: () => api.get('/orders/my-orders'),
  getOrderById: (id) => api.get(`/orders/${id}`),
  downloadReceipt: (id) => api.get(`/orders/${id}/receipt`, { responseType: 'blob' }),
  createStripeSession: (data) => api.post('/orders/stripe/create-session', data),
  getAllOrders: (params) => api.get('/orders', { params }),
};

export const adminAPI = {
  getDashboard: (range = '30d') => api.get('/admin/dashboard', { params: { range } }),
};

// Progress API
export const progressAPI = {
  getCourseProgress: (courseId) => api.get(`/progress/course/${courseId}`),
  updateLessonProgress: (courseId, lessonId, data) =>
    api.put(`/progress/lesson/${courseId}/${lessonId}`, data),
  getAllUserProgress: () => api.get('/progress/all/my-progress'),
  getCourseStudentsProgress: (courseId) =>
    api.get(`/progress/course/${courseId}/students`),
  getCourseAnalytics: (courseId) => api.get(`/progress/analytics/${courseId}`),
  downloadCertificate: (courseId) => api.get(`/progress/course/${courseId}/certificate`, { responseType: 'blob' }),
};

export default api;

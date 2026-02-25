import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });

          localStorage.setItem('token', data.token);
          localStorage.setItem('refreshToken', data.refreshToken);

          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
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
  uploadThumbnail: (file) => {
    const formData = new FormData();
    formData.append('thumbnail', file);
    return api.post('/courses/upload/thumbnail', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadIntroVideo: (file) => {
    const formData = new FormData();
    formData.append('video', file);
    return api.post('/courses/upload/intro-video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
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
  getModuleLessons: (moduleId) => api.get(`/lessons/module/${moduleId}/all`),
  createLesson: (data) => api.post('/lessons', data),
  updateLesson: (id, data) => api.put(`/lessons/${id}`, data),
  deleteLesson: (id) => api.delete(`/lessons/${id}`),
  addResources: (id, data) => api.post(`/lessons/${id}/resources`, data),
  removeResource: (id, data) => api.delete(`/lessons/${id}/resource`, { data }),
  uploadLessonVideo: (file) => {
    const formData = new FormData();
    formData.append('video', file);
    return api.post('/lessons/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Order API
export const orderAPI = {
  createOrder: (data) => api.post('/orders', data),
  getUserOrders: () => api.get('/orders/my-orders'),
  getOrderById: (id) => api.get(`/orders/${id}`),
  confirmOrderPayment: (id) => api.post(`/orders/${id}/confirm`),
  createStripeSession: (data) => api.post('/orders/stripe/create-session', data),
  getAllOrders: (params) => api.get('/orders', { params }),
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
};

export default api;
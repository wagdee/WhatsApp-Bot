import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// إضافة التوكن لكل طلب
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// معالجة الأخطاء
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    
    // معالجة أخطاء الشبكة
    if (!error.response) {
      return Promise.reject({
        success: false,
        message: 'خطأ في الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت أو تشغيل الخادم المحلي',
        isNetworkError: true
      });
    }
    
    return Promise.reject(error.response?.data || error);
  }
);

// API للمصادقة
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
    
  register: (username: string, email: string, password: string) =>
    apiClient.post('/auth/register', { username, email, password }),
    
  verify: () => apiClient.get('/auth/verify'),
};

// API لـ WhatsApp
export const whatsappApi = {
  getStatus: () => apiClient.get('/whatsapp/status'),
  sendMessage: (phoneNumber: string, message: string) =>
    apiClient.post('/whatsapp/send', { phoneNumber, message }),
};

// API للرسائل المجدولة
export const messagesApi = {
  getScheduled: () => apiClient.get('/messages/scheduled'),
  schedule: (phoneNumber: string, message: string, scheduledTime: string) =>
    apiClient.post('/messages/schedule', { phoneNumber, message, scheduledTime }),
  delete: (id: string) => apiClient.delete(`/messages/scheduled/${id}`),
};

// API للردود التلقائية
export const autoReplyApi = {
  getAll: () => apiClient.get('/auto-reply'),
  create: (triggerText: string, responseText: string, matchType: string = 'contains') =>
    apiClient.post('/auto-reply', { triggerText, responseText, matchType }),
  update: (id: string, updates: any) => apiClient.put(`/auto-reply/${id}`, updates),
  delete: (id: string) => apiClient.delete(`/auto-reply/${id}`),
};

export default apiClient;
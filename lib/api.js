import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ── Change this to your machine's local IP while developing ──
export const BASE_URL = __DEV__
  ? 'http://192.168.1.100:3000/api'
  : 'https://api.diabetescare.app/api';

const ACCESS_KEY  = 'dc_access_token';
const REFRESH_KEY = 'dc_refresh_token';

export const tokenStorage = {
  getAccess:    () => SecureStore.getItemAsync(ACCESS_KEY),
  getRefresh:   () => SecureStore.getItemAsync(REFRESH_KEY),
  setAccess:  (t) => SecureStore.setItemAsync(ACCESS_KEY, t),
  setRefresh: (t) => SecureStore.setItemAsync(REFRESH_KEY, t),
  clear: async () => {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  res => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = await tokenStorage.getRefresh();
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        await tokenStorage.setAccess(data.accessToken);
        await tokenStorage.setRefresh(data.refreshToken);
        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        await tokenStorage.clear();
        throw err;
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default api;

// ── Endpoint groups ───────────────────────────────────────────
export const authApi = {
  login:    (email, password) => api.post('/auth/login', { email, password }),
  register: (data)            => api.post('/auth/register', data),
  logout:   (refreshToken)    => api.post('/auth/logout', { refreshToken }),
  me:       ()                => api.get('/auth/me'),
};

export const glucoseApi = {
  getReadings: (patientId, from, to) =>
    api.get(`/glucose/${patientId}`, { params: { from, to } }),
  addReading: (data)  => api.post('/glucose', data),
  getStats:   (patientId, period) =>
    api.get(`/glucose/${patientId}/stats`, { params: { period } }),
};

export const patientApi = {
  getAll:  (params) => api.get('/patients', { params }),
  getById: (id)     => api.get(`/patients/${id}`),
  update:  (id, data) => api.patch(`/patients/${id}`, data),
};

export const alertsApi = {
  getAll:      (params) => api.get('/alerts', { params }),
  acknowledge: (id)     => api.patch(`/alerts/${id}/acknowledge`),
};

export const appointmentsApi = {
  getAll:  (params)     => api.get('/appointments', { params }),
  create:  (data)       => api.post('/appointments', data),
  update:  (id, data)   => api.patch(`/appointments/${id}`, data),
  cancel:  (id)         => api.patch(`/appointments/${id}/cancel`),
};

export const messagesApi = {
  getConversations: ()      => api.get('/messages/conversations'),
  getMessages:      (userId) => api.get(`/messages/${userId}`),
  send:             (data)  => api.post('/messages', data),
};

export const reportsApi = {
  generate: (patientId, period) =>
    api.get(`/reports/${patientId}`, { params: { period } }),
};

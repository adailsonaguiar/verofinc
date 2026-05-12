import axios from 'axios';

// ─── Offline data cache ──────────────────────────────────────────────────────
const CACHE_PREFIX = 'verofinc_cache_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function buildCacheKey(url: string, params?: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) return url;
  const qs = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return `${url}?${qs}`;
}

function saveToCache(key: string, data: unknown): void {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, ts: Date.now() })
    );
  } catch {
    // Storage quota exceeded — ignore silently
  }
}

function loadFromCache(key: string): unknown | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: unknown; ts: number };
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Persist successful GET responses for offline use
    if (response.config.method === 'get' && response.config.url) {
      const key = buildCacheKey(
        response.config.url,
        response.config.params as Record<string, unknown>
      );
      saveToCache(key, response.data);
    }
    return response;
  },
  (error) => {
    // Network error on GET — serve from cache if available
    if (!error.response && error.config?.method === 'get' && error.config?.url) {
      const key = buildCacheKey(
        error.config.url,
        error.config.params as Record<string, unknown>
      );
      const cached = loadFromCache(key);
      if (cached !== null) {
        return Promise.resolve({
          data: cached,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config,
        });
      }
    }
    if (error?.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { api, post } from '../api/api-client';

type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  companyId: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | undefined>(undefined);

const TOKEN_KEY = 'mp_auth_token';

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Attach axios interceptor for Authorization header
  useEffect(() => {
    const id = api.interceptors.request.use((config) => {
      const t = getAuthToken();
      if (t) {
        if (!config.headers) config.headers = {} as any;
        // AxiosHeaders supports set via bracket notation
        (config.headers as any).Authorization = `Bearer ${t}`;
      }
      return config;
    });
    // Global response interceptor for auth errors
    const rid = api.interceptors.response.use(
      (resp) => resp,
      async (error) => {
        const status = error?.response?.status;
        const original = error?.config;
        const url: string | undefined = original?.url;
        const isAuthEndpoint = typeof url === 'string' && url.includes('/auth/');
        const isRefreshRequest = typeof url === 'string' && url.includes('/auth/refresh');

        if ((status === 401 || status === 403) && original && !original.__isRetry && !isAuthEndpoint) {
          // Try refresh once for non-auth endpoints
          original.__isRetry = true;
          try {
            const resp = await api.post('/auth/refresh');
            const token = resp?.data?.data?.token as string | undefined;
            if (token) {
              setAuthToken(token);
              setToken(token);
              // Retry original request with new token
              original.headers = { ...(original.headers || {}), Authorization: `Bearer ${token}` };
              return api(original);
            }
          } catch {
            // fallthrough to logout
          }
        }

  if (status === 401 || status === 403 || isRefreshRequest || isAuthEndpoint) {
          try {
            if (!isRefreshRequest) {
              // Best-effort clear server cookie unless refresh already failed
              try {
                await api.post('/auth/logout');
              } catch {}
            }
            setAuthToken(null);
            setUser(null);
            setToken(null);
          } catch {}
          const next = encodeURIComponent(window.location.pathname + window.location.search);
          if (window.location.pathname !== '/login') {
            window.location.assign(`/login?next=${next}`);
          }
        }
        return Promise.reject(error);
      }
    );
    return () => {
      api.interceptors.request.eject(id);
      api.interceptors.response.eject(rid);
    };
  }, []);

  // Bootstrap from localStorage
  useEffect(() => {
    const boot = async () => {
      const t = getAuthToken();
      if (!t) {
        setLoading(false);
        return;
      }
      setToken(t);
      try {
        const me = await api.get('/auth/me');
        const json = me.data as any;
        if (json?.success) setUser(json.data);
      } catch {
        setAuthToken(null);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    void boot();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await post<{ token: string }>('/auth/login', { email, password });
    if (!res.success) throw new Error(res.message || 'Login failed');
    const t = (res.data as any).token as string;
    setAuthToken(t);
    setToken(t);
    const me = await api.get('/auth/me');
    const json = me.data as any;
    if (json?.success) setUser(json.data);
    // If on login page and next param provided, navigate via replace
    try {
      const url = new URL(window.location.href);
      const next = url.searchParams.get('next');
      if (window.location.pathname === '/login') {
        window.location.replace(next || '/');
      }
    } catch {}
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    setAuthToken(null);
    setUser(null);
    setToken(null);
    // Force navigation so app state resets
    window.location.assign('/login');
  };

  const refreshUser = useCallback(async () => {
    const t = getAuthToken();
    if (!t) {
      setUser(null);
      setToken(null);
      return;
    }
    try {
      const me = await api.get('/auth/me');
      const json = me.data as any;
      if (json?.success) setUser(json.data);
    } catch {
      setAuthToken(null);
      setUser(null);
      setToken(null);
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, token, loading, login, logout, refreshUser }),
    [user, token, loading, refreshUser]
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

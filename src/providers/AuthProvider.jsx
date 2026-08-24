// providers/AuthProvider.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthContext, transformUserData, ROLES } from '../contexts/AuthContext';
import { auth as authApi } from '../api/endpoints';
import { tokenStore, setSessionExpiredHandler } from '../api/client';
import { API_BASE_URL, API_ROOT } from '../api/config';

export { API_BASE_URL, API_ROOT };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setToken(null);
  }, []);

  // The API client calls this when a refresh fails mid-request.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setToken(null);
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  // Restore the session on boot: show the cached user immediately, then
  // revalidate against /auth/me/ so a revoked account doesn't linger.
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      const storedToken = tokenStore.getAccess();
      const storedUser = tokenStore.getUser();

      if (!storedToken) {
        setLoading(false);
        return;
      }

      if (storedUser && !cancelled) {
        setUser(storedUser);
        setToken(storedToken);
      }

      try {
        const data = await authApi.me();
        if (cancelled) return;

        const fresh = transformUserData(data.profile || data.user || data);
        setUser(fresh);
        setToken(tokenStore.getAccess());
        tokenStore.set({ user: fresh });
      } catch (error) {
        // 401 means the refresh token is dead too — drop the session.
        // Anything else (server down, offline) keeps the cached user.
        if (!cancelled && error.status === 401) clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    restore();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const persist = useCallback((userData, tokens) => {
    const transformed = transformUserData(userData);
    tokenStore.set({
      access: tokens?.access,
      refresh: tokens?.refresh,
      user: transformed,
    });
    setUser(transformed);
    setToken(tokens?.access || tokenStore.getAccess());
    return transformed;
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await authApi.login(email, password);
      return persist(data.user, data.tokens);
    },
    [persist],
  );

  const register = useCallback(
    async (payload) => {
      const data = await authApi.register(payload);
      return persist(data.user, data.tokens);
    },
    [persist],
  );

  const logout = useCallback(async () => {
    const refresh = tokenStore.getRefresh();
    try {
      if (refresh) await authApi.logout(refresh);
    } catch {
      // Blacklisting is best-effort; the local session goes either way.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  // Re-pull the current user (after a profile edit, say).
  const refreshUser = useCallback(async () => {
    const data = await authApi.me();
    const fresh = transformUserData(data.profile || data.user || data);
    setUser(fresh);
    tokenStore.set({ user: fresh });
    return fresh;
  }, []);

  const value = useMemo(
    () => ({
      API_BASE_URL,
      API_ROOT,
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
      refreshUser,
      setUser,
      isAdmin: user?.role === ROLES.ADMIN,
      isApprentice: user?.role === ROLES.APPRENTICE,
      isCustomer: user?.role === ROLES.CUSTOMER,
      // Admin pages are open to apprentices for day-to-day order handling.
      isStaff: user?.role === ROLES.ADMIN || user?.role === ROLES.APPRENTICE,
    }),
    [user, token, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

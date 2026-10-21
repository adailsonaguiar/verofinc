import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authService, AuthUser } from '../services/authService';
import {
  signInWithGoogle,
  signOutFromGoogle,
} from '../services/googleAuth';
import { clearOfflineCache } from '../services/api';
import { queryClient } from '../lib/queryClient';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem('authUser');
    return raw ? JSON.parse(raw) : null;
  });

  const resetCaches = useCallback(() => {
    queryClient.clear();
    clearOfflineCache();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authService.login(email, password);
      resetCaches();
      localStorage.setItem('authUser', JSON.stringify(data.user));
      setUser(data.user);
    },
    [resetCaches]
  );

  const loginWithGoogle = useCallback(async () => {
    const idToken = await signInWithGoogle();
    const data = await authService.loginWithGoogle(idToken);
    resetCaches();
    localStorage.setItem('authUser', JSON.stringify(data.user));
    setUser(data.user);
  }, [resetCaches]);

  const logout = useCallback(async () => {
    await signOutFromGoogle();
    await authService.logout();
    resetCaches();
    localStorage.removeItem('authUser');
    setUser(null);
  }, [resetCaches]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      loginWithGoogle,
      logout,
    }),
    [user, login, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const RequireAuth: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

import React, {
  createContext,
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

  const login = async (email: string, password: string) => {
    const data = await authService.login(email, password);
    localStorage.setItem('authUser', JSON.stringify(data.user));
    setUser(data.user);
  };

  const loginWithGoogle = async () => {
    const idToken = await signInWithGoogle();
    const data = await authService.loginWithGoogle(idToken);
    localStorage.setItem('authUser', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = async () => {
    await signOutFromGoogle();
    await authService.logout();
    localStorage.removeItem('authUser');
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      loginWithGoogle,
      logout,
    }),
    [user]
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

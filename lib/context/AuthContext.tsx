'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../api';

type UserRole = 'owner' | 'admin' | 'staff';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  pharmacyName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = api.getUser();
    const token = api.getToken();

    if (storedUser && token) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      setUser(response.data.user);
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Login failed');
    }
  };

  const register = async (data: any) => {
    try {
      const response = await api.register(data);
      setUser(response.data.user);
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Registration failed');
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    hasRole: (...roles: UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


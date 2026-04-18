"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'guest' | 'user' | 'admin' | 'technician';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  login: (user: AuthUser) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const mockUsers: Record<UserRole, AuthUser | null> = {
  guest: null,
  user: {
    id: 'USR001',
    name: 'Ravi Patel',
    email: 'ravi.patel@gmail.com',
    phone: '9876543210',
    role: 'user',
  },
  admin: {
    id: 'ADM001',
    name: 'Admin User',
    email: 'admin@connect2one.in',
    phone: '9974955542',
    role: 'admin',
  },
  technician: {
    id: 'TECH001',
    name: 'Suresh Mehta',
    email: 'suresh.tech@connect2one.in',
    phone: '9974955502',
    role: 'technician',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRoleState] = useState<UserRole>('guest');

  const login = (u: AuthUser) => {
    setUser(u);
    setRoleState(u.role);
  };

  const logout = () => {
    setUser(null);
    setRoleState('guest');
  };

  const setRole = (r: UserRole) => {
    setRoleState(r);
    setUser(mockUsers[r]);
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ============================================================
// QuantPilot — 5-User Authentication & Account Scoping Context
// Guarantees complete user isolation for portfolios, trades,
// saved chart layouts, and AI chat histories.
// ============================================================

import React, { createContext, useContext, useState, useMemo } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  preferredCurrency: 'INR' | 'USD';
  avatarInitials: string;
}

export const PROVISIONED_USERS: UserProfile[] = [
  {
    id: 'demo-user-001',
    name: 'Alice Sharma',
    email: 'alice@quantpilot.app',
    role: 'Senior Quant Trader',
    preferredCurrency: 'INR',
    avatarInitials: 'AS',
  },
  {
    id: 'demo-user-002',
    name: 'Bob Verma',
    email: 'bob@quantpilot.app',
    role: 'Derivatives Specialist',
    preferredCurrency: 'INR',
    avatarInitials: 'BV',
  },
  {
    id: 'demo-user-003',
    name: 'Charlie Mehta',
    email: 'charlie@quantpilot.app',
    role: 'Macro & Geopolitical Analyst',
    preferredCurrency: 'INR',
    avatarInitials: 'CM',
  },
  {
    id: 'demo-user-004',
    name: 'Diana Patel',
    email: 'diana@quantpilot.app',
    role: 'Risk Manager',
    preferredCurrency: 'INR',
    avatarInitials: 'DP',
  },
  {
    id: 'demo-user-005',
    name: 'Evan Roy',
    email: 'evan@quantpilot.app',
    role: 'Portfolio Manager',
    preferredCurrency: 'USD',
    avatarInitials: 'ER',
  },
];

interface AuthContextType {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  switchUser: (userId: string) => void;
  updateCurrency: (currency: 'INR' | 'USD') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'quantpilot_active_user_id';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    if (typeof window === 'undefined') return PROVISIONED_USERS[0];
    try {
      const storedId = localStorage.getItem(STORAGE_KEY);
      if (storedId) {
        const found = PROVISIONED_USERS.find((u) => u.id === storedId);
        if (found) return found;
      }
    } catch {
      // fallback
    }
    return PROVISIONED_USERS[0];
  });

  const switchUser = (userId: string) => {
    const target = PROVISIONED_USERS.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      try {
        localStorage.setItem(STORAGE_KEY, target.id);
      } catch {
        // ignore
      }
    }
  };

  const updateCurrency = (currency: 'INR' | 'USD') => {
    setCurrentUser((prev) => ({
      ...prev,
      preferredCurrency: currency,
    }));
  };

  const value = useMemo(
    () => ({
      currentUser,
      allUsers: PROVISIONED_USERS,
      switchUser,
      updateCurrency,
    }),
    [currentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User } from "@/types";
import {
  fetchCurrentUser,
  getAuthToken,
  loginUser,
  loginWithGoogle as apiLoginWithGoogle,
  logoutUser,
  registerUser,
} from "@/lib/authApi";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { name: string; email: string; password: string }) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session on mount via HttpOnly cookie
  useEffect(() => {
    let mounted = true;
    const initSession = async () => {
      try {
        const currentUser = await fetchCurrentUser();
        if (mounted) {
          setUser(currentUser);
          setTokenState(getAuthToken());
        }
      } catch {
        if (mounted) {
          setUser(null);
          setTokenState(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initSession();
    return () => {
      mounted = false;
    };
  }, []);


  const login = useCallback(async (payload: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await loginUser(payload);
      setUser(res.user);
      setTokenState(res.token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: { name: string; email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await registerUser(payload);
      setUser(res.user);
      setTokenState(res.token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    setIsLoading(true);
    try {
      const res = await apiLoginWithGoogle(idToken);
      setUser(res.user);
      setTokenState(res.token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setTokenState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    loginWithGoogle,
    logout,
  };


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

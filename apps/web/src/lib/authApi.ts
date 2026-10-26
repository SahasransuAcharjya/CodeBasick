/**
 * Client API for authentication, registration, login, and session management.
 * Communicates with FastAPI backend (/api/v1/auth).
 */

import { User } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const AUTH_TOKEN_KEY = "codebasick_auth_token_v1";

let inMemoryToken: string | null = null;

export function getAuthToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(AUTH_TOKEN_KEY);
    if (stored) {
      inMemoryToken = stored;
      return stored;
    }
  }
  return null;
}

export function setAuthToken(token: string | null): void {
  inMemoryToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    name: string;
    auth_provider: "local" | "google";
    created_at: string;
  };
}

function mapUserResponse(raw: AuthResponse["user"]): User {
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name,
    authProvider: raw.auth_provider,
    createdAt: raw.created_at,
  };
}

export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Registration failed. Please check your details.");
  }

  setAuthToken(data.access_token);
  return {
    user: mapUserResponse(data.user),
    token: data.access_token,
  };
}

export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Invalid email or password.");
  }

  setAuthToken(data.access_token);
  return {
    user: mapUserResponse(data.user),
    token: data.access_token,
  };
}

export async function loginWithGoogle(idToken: string): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ id_token: idToken }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Google authentication failed.");
  }

  setAuthToken(data.access_token);
  return {
    user: mapUserResponse(data.user),
    token: data.access_token,
  };
}

export async function fetchCurrentUser(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      return mapUserResponse(data);
    }

    if (res.status === 401) {
      setAuthToken(null);
    }
  } catch (err) {
    console.warn("Could not reach auth server to verify user:", err);
  }

  return null;
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (err) {
    console.warn("Logout error:", err);
  } finally {
    setAuthToken(null);
  }
}

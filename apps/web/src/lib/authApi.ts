/**
 * Client API for authentication, registration, login, and session management.
 * Communicates with FastAPI backend (/api/v1/auth).
 *
 * Security Note:
 * Primary authentication is managed via secure, HttpOnly, SameSite session cookies.
 * Authentication tokens are NEVER stored in browser localStorage or sessionStorage.
 * An optional in-memory token reference is retained solely during the active page lifecycle.
 */

import { User } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Ephemeral in-memory token (never persisted to localStorage/sessionStorage)
let inMemoryToken: string | null = null;

// Clean up any legacy token that may have been saved in localStorage by earlier versions
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("codebasick_auth_token_v1");
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

export function getAuthToken(): string | null {
  return inMemoryToken;
}

export function setAuthToken(token: string | null): void {
  inMemoryToken = token;
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
      "X-Requested-With": "XMLHttpRequest",
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
      "X-Requested-With": "XMLHttpRequest",
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
      "X-Requested-With": "XMLHttpRequest",
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
  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    };
    if (inMemoryToken) {
      headers["Authorization"] = `Bearer ${inMemoryToken}`;
    }

    const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      method: "GET",
      headers,
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
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
      credentials: "include",
    });
  } catch (err) {
    console.warn("Logout error:", err);
  } finally {
    setAuthToken(null);
  }
}

/**
 * Local workspace & preferences persistence manager.
 * Provides real, honest client-side storage without fabricating server data.
 */

import { Workspace, WorkspacePreferences } from "@/types";

const WORKSPACES_STORAGE_KEY = "codebasick_workspaces_v1";
const PREFERENCES_STORAGE_KEY = "codebasick_preferences_v1";

const DEFAULT_PREFERENCES: WorkspacePreferences = {
  fontSize: 14,
  tabSize: 4,
  wordWrap: true,
  theme: "dark-charcoal",
};

export function getWorkspaces(): Workspace[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WORKSPACES_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to load workspaces from localStorage:", error);
    return [];
  }
}

export function getWorkspaceById(id: string): Workspace | undefined {
  const workspaces = getWorkspaces();
  return workspaces.find((w) => w.id === id);
}

export function createWorkspace(
  data: Pick<Workspace, "name" | "description" | "language">
): Workspace {
  const workspaces = getWorkspaces();
  const now = new Date().toISOString();
  const newWorkspace: Workspace = {
    id: `ws_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    name: data.name.trim(),
    description: data.description.trim(),
    language: data.language,
    createdAt: now,
    updatedAt: now,
    fileCount: 1, // starter file (main.py / index.js / index.html)
  };

  const updated = [newWorkspace, ...workspaces];
  try {
    localStorage.setItem(WORKSPACES_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save workspace to localStorage:", error);
  }
  return newWorkspace;
}

export function deleteWorkspace(id: string): boolean {
  const workspaces = getWorkspaces();
  const filtered = workspaces.filter((w) => w.id !== id);
  if (filtered.length === workspaces.length) return false;

  try {
    localStorage.setItem(WORKSPACES_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Failed to delete workspace from localStorage:", error);
    return false;
  }
}

export function getPreferences(): WorkspacePreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: Partial<WorkspacePreferences>): WorkspacePreferences {
  const current = getPreferences();
  const updated = { ...current, ...prefs };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save preferences:", error);
    }
  }
  return updated;
}

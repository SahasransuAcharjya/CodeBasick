/**
 * Client API for persistent project & file storage in CodeBasick.
 * Connects to FastAPI backend (/api/v1/projects) with client-owner isolation,
 * and maintains resilient local fallback caching.
 */

import { Workspace, WorkspaceFile, ProgrammingLanguage } from "@/types";
import {
  getWorkspaces as getLocalWorkspaces,
  getWorkspaceById as getLocalWorkspaceById,
  createWorkspace as createLocalWorkspace,
  updateWorkspace as updateLocalWorkspace,
  deleteWorkspace as deleteLocalWorkspace,
  ensureWorkspaceFiles,
} from "./storage";
import { getAuthToken } from "./authApi";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const CLIENT_OWNER_ID_KEY = "codebasick_client_owner_id";

export interface RemoteProjectFile {
  id: string;
  name: string;
  language: string;
  content: string;
  is_entry?: boolean;
}

export interface RemoteProjectResponse {
  id: string;
  name: string;
  description?: string;
  language: ProgrammingLanguage;
  created_at: string;
  updated_at: string;
  file_count?: number;
  files?: RemoteProjectFile[];
  active_file_id?: string;
  open_file_ids?: string[];
  storage?: "mongodb" | "in_memory";
}

export interface RemoteProjectSummary {
  id: string;
  name: string;
  description?: string;
  language: ProgrammingLanguage;
  created_at: string;
  updated_at: string;
  file_count: number;
  storage?: "mongodb" | "in_memory";
}

export interface SaveProjectResult {
  workspace: Workspace;
  isRemote: boolean;
  storageBackend: "mongodb" | "in_memory" | "local";
}

/**
 * Get or generate a persistent client owner ID for tenant isolation.
 */
export function getClientOwnerId(): string {
  if (typeof window === "undefined") {
    return "local-developer-owner";
  }
  let ownerId = localStorage.getItem(CLIENT_OWNER_ID_KEY);
  if (!ownerId) {
    ownerId = `client_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem(CLIENT_OWNER_ID_KEY, ownerId);
  }
  return ownerId;
}

/**
 * Standard headers with client-owner isolation token.
 */
function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Client-Owner-ID": getClientOwnerId(),
  };
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Map backend project schema to frontend Workspace model.
 */
function mapProjectToWorkspace(data: RemoteProjectResponse): Workspace {
  const files: WorkspaceFile[] = (data.files || []).map((f) => ({
    id: f.id,
    name: f.name,
    language: f.language as ProgrammingLanguage,
    content: f.content || "",
    isEntry: f.is_entry,
    isStarter: false,
  }));

  const ws: Workspace = {
    id: data.id,
    name: data.name,
    description: data.description || "",
    language: data.language,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    fileCount: data.file_count || files.length,
    files,
    activeFileId: data.active_file_id || (files[0]?.id ?? ""),
    openFileIds: data.open_file_ids && data.open_file_ids.length > 0 ? data.open_file_ids : [files[0]?.id ?? ""],
    storageBackend: (data.storage as "mongodb" | "in_memory") || "mongodb",
  };

  return ensureWorkspaceFiles(ws);
}

/**
 * Fetch all projects belonging to the current owner.
 */
export async function fetchProjects(limit = 50, offset = 0): Promise<{
  items: Workspace[];
  total: number;
  isRemote: boolean;
  storageBackend: "mongodb" | "in_memory" | "local";
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/projects?limit=${limit}&offset=${offset}`, {
      method: "GET",
      headers: getHeaders(),
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      const storageHeader = (res.headers.get("X-Storage-Backend") as "mongodb" | "in_memory") || data.storage || "mongodb";
      const items = (data.items || []).map((item: RemoteProjectSummary) => {
        // Summaries don't have full files, check local cache or construct base
        const cached = getLocalWorkspaceById(item.id);
        if (cached) {
          cached.name = item.name;
          cached.updatedAt = item.updated_at;
          cached.fileCount = item.file_count;
          cached.storageBackend = storageHeader;
          return cached;
        }
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          language: item.language,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          fileCount: item.file_count,
          storageBackend: storageHeader,
        } as Workspace;
      });
      return { items, total: data.total, isRemote: true, storageBackend: storageHeader };
    }
  } catch (error) {
    console.warn("Backend API offline or unreachable, falling back to local storage:", error);
  }

  // Resilient fallback to local storage
  const locals = getLocalWorkspaces().map((ws) => ({
    ...ws,
    storageBackend: "local" as const,
  }));
  return { items: locals, total: locals.length, isRemote: false, storageBackend: "local" };
}

/**
 * Fetch a single project by ID with full files.
 */
export async function fetchProject(id: string): Promise<{
  workspace: Workspace | null;
  isRemote: boolean;
  storageBackend: "mongodb" | "in_memory" | "local";
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/projects/${id}`, {
      method: "GET",
      headers: getHeaders(),
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      const storageHeader = (res.headers.get("X-Storage-Backend") as "mongodb" | "in_memory") || data.storage || "mongodb";
      const workspace = mapProjectToWorkspace(data);
      workspace.storageBackend = storageHeader;
      // Cache to local storage
      updateLocalWorkspace(workspace);
      return { workspace, isRemote: true, storageBackend: storageHeader };
    }
  } catch (error) {
    console.warn(`Failed to fetch project ${id} from API, checking local storage:`, error);
  }

  // Fallback to local storage
  const local = getLocalWorkspaceById(id);
  if (local) {
    local.storageBackend = "local";
  }
  return { workspace: local || null, isRemote: false, storageBackend: "local" };
}

/**
 * Create a new persistent project on the backend.
 */
export async function createProject(
  payload: Pick<Workspace, "name" | "description" | "language">
): Promise<Workspace> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/projects`, {
      method: "POST",
      headers: getHeaders(),
      credentials: "include",
      body: JSON.stringify({
        name: payload.name.trim(),
        language: payload.language,
        description: payload.description?.trim() || "",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const storageHeader = (res.headers.get("X-Storage-Backend") as "mongodb" | "in_memory") || data.storage || "mongodb";
      const workspace = mapProjectToWorkspace(data);
      workspace.storageBackend = storageHeader;
      // Also write to local storage as cache
      updateLocalWorkspace(workspace);
      return workspace;
    }
  } catch (error) {
    console.warn("Backend API unreachable during project creation, creating locally:", error);
  }

  // Local fallback
  const created = createLocalWorkspace(payload);
  created.storageBackend = "local";
  return created;
}

/**
 * Update project metadata or sync full file buffers (used by autosave).
 */
export async function updateProject(
  id: string,
  updates: {
    name?: string;
    description?: string;
    language?: string;
    activeFileId?: string;
    openFileIds?: string[];
    files?: WorkspaceFile[];
  }
): Promise<SaveProjectResult> {
  // Always update local cache first for zero-data-loss resiliency
  const local = getLocalWorkspaceById(id);
  if (local) {
    if (updates.name !== undefined) local.name = updates.name;
    if (updates.description !== undefined) local.description = updates.description;
    if (updates.language !== undefined) local.language = updates.language as ProgrammingLanguage;
    if (updates.activeFileId !== undefined) local.activeFileId = updates.activeFileId;
    if (updates.openFileIds !== undefined) local.openFileIds = updates.openFileIds;
    if (updates.files !== undefined) local.files = updates.files;
    updateLocalWorkspace(local);
  }

  try {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.language !== undefined) payload.language = updates.language;
    if (updates.activeFileId !== undefined) payload.active_file_id = updates.activeFileId;
    if (updates.openFileIds !== undefined) payload.open_file_ids = updates.openFileIds;
    if (updates.files !== undefined) {
      payload.files = updates.files.map((f) => ({
        id: f.id,
        name: f.name,
        path: f.name,
        language: f.language,
        content: f.content,
        is_entry: f.isEntry || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    }

    const res = await fetch(`${API_BASE_URL}/api/v1/projects/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      const storageHeader = (res.headers.get("X-Storage-Backend") as "mongodb" | "in_memory") || data.storage || "mongodb";
      const mapped = mapProjectToWorkspace(data);
      mapped.storageBackend = storageHeader;
      updateLocalWorkspace(mapped);
      return { workspace: mapped, isRemote: true, storageBackend: storageHeader };
    }
  } catch (error) {
    console.warn(`Failed to update project ${id} on backend:`, error);
  }

  return { workspace: local || ({} as Workspace), isRemote: false, storageBackend: "local" };
}

/**
 * Delete a project on the backend and remove from local cache.
 */
export async function deleteProject(id: string): Promise<boolean> {
  let remoteDeleted = false;
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/projects/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
      credentials: "include",
    });
    if (res.ok) {
      remoteDeleted = true;
    }
  } catch (error) {
    console.warn(`Failed to delete project ${id} from API:`, error);
  }

  // Remove from local cache
  deleteLocalWorkspace(id);
  return remoteDeleted || true;
}

/**
 * Add a new file to an existing project on the backend.
 */
export async function addProjectFile(
  projectId: string,
  file: Pick<WorkspaceFile, "name" | "content" | "language">
): Promise<WorkspaceFile> {
  const newFile: WorkspaceFile = {
    id: `file_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    name: file.name,
    language: file.language,
    content: file.content || "",
    isStarter: false,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}/files`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        name: file.name,
        language: file.language,
        content: file.content || "",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      newFile.id = data.id;
      newFile.name = data.name;
      newFile.content = data.content;
      newFile.language = data.language;
    }
  } catch (error) {
    console.warn(`Failed to add file to backend for project ${projectId}:`, error);
  }

  return newFile;
}

/**
 * Delete a file from a project on the backend.
 */
export async function deleteProjectFile(projectId: string, fileId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}/files/${fileId}`, {
      method: "DELETE",
      headers: getHeaders(),
      credentials: "include",
    });
    return res.ok;
  } catch (error) {
    console.warn(`Failed to delete file ${fileId} on backend:`, error);
    return false;
  }
}

/**
 * Safely import an anonymous local workspace into the user's authenticated cloud account.
 */
export async function importLocalWorkspaceToCloud(localWorkspace: Workspace): Promise<Workspace> {
  const res = await fetch(`${API_BASE_URL}/api/v1/projects`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify({
      name: localWorkspace.name.trim(),
      language: localWorkspace.language,
      description: localWorkspace.description?.trim() || "",
      files: localWorkspace.files?.map((f) => ({
        name: f.name,
        language: f.language,
        content: f.content,
        is_entry: f.isEntry || false,
      })),
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to import workspace to cloud.");
  }

  const data = await res.json();
  const storageHeader = (res.headers.get("X-Storage-Backend") as "mongodb" | "in_memory") || data.storage || "mongodb";
  const workspace = mapProjectToWorkspace(data);
  workspace.storageBackend = storageHeader;
  return workspace;
}


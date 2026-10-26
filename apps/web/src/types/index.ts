/** Core Domain Models & Application Types */

export type ProgrammingLanguage = "c" | "python" | "javascript" | "html-css";

export interface WorkspaceFile {
  id: string;
  name: string;
  language: ProgrammingLanguage;
  content: string;
  isEntry?: boolean;
  isStarter?: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  language: ProgrammingLanguage;
  createdAt: string;
  updatedAt: string;
  fileCount: number;
  files?: WorkspaceFile[];
  activeFileId?: string;
  openFileIds?: string[];
  storageBackend?: "mongodb" | "in_memory" | "local";
}

export interface WorkspacePreferences {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  theme: "dark-charcoal";
}

export interface HealthResponse {
  status: string;
  app: string;
  version: string;
}

export interface NavItem {
  label: string;
  href: string;
  iconName: "layout-dashboard" | "folder-code" | "settings" | "book-open" | "terminal";
  badge?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  authProvider: "local" | "google";
  createdAt: string;
}

export interface AuthSession {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}


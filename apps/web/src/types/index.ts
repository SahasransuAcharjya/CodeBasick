/** Core Domain Models & Application Types */

export type ProgrammingLanguage = "python" | "javascript" | "html-css";

export interface Workspace {
  id: string;
  name: string;
  description: string;
  language: ProgrammingLanguage;
  createdAt: string;
  updatedAt: string;
  fileCount: number;
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

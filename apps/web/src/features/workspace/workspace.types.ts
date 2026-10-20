/**
 * Type definitions for the CodeBasick Workspace feature.
 */

export type ProgrammingLanguage = "c" | "python" | "javascript" | "html-css";

export interface WorkspaceFile {
  id: string;
  name: string;
  language: ProgrammingLanguage;
  content: string;
  isEntry?: boolean;
  isStarter?: boolean;
}

export interface WorkspaceData {
  id: string;
  name: string;
  description: string;
  language: ProgrammingLanguage;
  files: WorkspaceFile[];
  activeFileId: string;
  openFileIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OutputMessage {
  id: string;
  type: "info" | "status" | "warning" | "error" | "notice";
  text: string;
  timestamp: string;
}

export interface DiagnosticItem {
  id: string;
  line?: number;
  column?: number;
  severity: "info" | "warning" | "error";
  message: string;
  source: string;
}

export interface ExecutionStatusState {
  target: string;
  state: "idle" | "ready" | "pending-phase5";
  lastRunAt: string | null;
  exitCode: number | string | null;
  lineCount: number;
  byteCount: number;
}

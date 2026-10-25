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

export type ExecutionState =
  | "idle"
  | "ready"
  | "running"
  | "success"
  | "failed"
  | "timeout"
  | "unconfigured"
  | "error";

export interface ExecutionStatusState {
  target: string;
  state: ExecutionState;
  lastRunAt: string | null;
  exitCode: number | string | null;
  lineCount: number;
  byteCount: number;
  executionTime?: number | null;
  compilationTime?: number | null;
  memoryUsed?: number | null;
  message?: string | null;
}

export interface ExecuteApiResponse {
  stdout: string | null;
  stderr: string | null;
  exception: string | null;
  status: "success" | "failed" | "error" | "timeout" | "unconfigured";
  executionTime: number | null;
  compilationTime: number | null;
  memoryUsed: number | null;
  language: string;
  message?: string | null;
}

export interface PseudocodeStep {
  step_number: number;
  label: string;
  description: string;
  line_reference?: string | null;
}

export interface PseudocodeApiResponse {
  language: string;
  summary: string;
  pseudocode: string;
  steps: PseudocodeStep[];
  limitations?: string | null;
  is_incomplete: boolean;
  model: string;
}

export interface LineExplanationItem {
  line_number: number;
  code: string;
  explanation: string;
  concepts: string[];
  caveats?: string | null;
}

export interface ExplainApiResponse {
  language: string;
  overview: string;
  explanations: LineExplanationItem[];
  caveats?: string | null;
  disclaimer: string;
  is_incomplete: boolean;
  model: string;
}



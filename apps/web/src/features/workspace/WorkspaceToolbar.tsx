import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Play,
  RotateCcw,
  Sidebar as SidebarIcon,
  Sparkles,
  Terminal,
  Check,
  Loader2,
  CloudUpload,
  AlertCircle,
  Edit2,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ProgrammingLanguage } from "./workspace.types";
import styles from "./WorkspaceToolbar.module.css";

export type SaveStatus = "saved" | "saved-local" | "saving" | "unsaved" | "error";

export interface WorkspaceToolbarProps {
  workspaceName: string;
  language: ProgrammingLanguage;
  onLanguageChange: (lang: ProgrammingLanguage) => void;
  onRun: () => void;
  onReset: () => void;
  onGeneratePseudocode?: () => void;
  onExplainCode?: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isOutputOpen: boolean;
  onToggleOutput: () => void;
  isRunDisabled?: boolean;
  isRunning?: boolean;
  isGeneratingPseudocode?: boolean;
  isGeneratingExplanation?: boolean;
  // Phase 7B / 7B.1: Persistent Storage & Autosave
  saveStatus?: SaveStatus;
  onSave?: () => void;
  lastSavedAt?: string | null;
  onRenameWorkspace?: (newName: string) => void;
}

export function WorkspaceToolbar({
  workspaceName,
  language,
  onLanguageChange,
  onRun,
  onReset,
  onGeneratePseudocode,
  onExplainCode,
  isSidebarOpen,
  onToggleSidebar,
  isOutputOpen,
  onToggleOutput,
  isRunDisabled = false,
  isRunning = false,
  isGeneratingPseudocode = false,
  isGeneratingExplanation = false,
  saveStatus = "saved",
  onSave,
  lastSavedAt,
  onRenameWorkspace,
}: WorkspaceToolbarProps) {
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(workspaceName);

  const handleOpenRename = () => {
    setRenameValue(workspaceName);
    setIsRenameOpen(true);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (renameValue.trim() && onRenameWorkspace) {
      onRenameWorkspace(renameValue.trim());
    }
    setIsRenameOpen(false);
  };

  return (
    <header className={styles.toolbar}>
      {/* Left: Navigation, Workspace Name, Rename, Save Status */}
      <div className={styles.left}>
        <button
          type="button"
          className={`${styles.iconToggle} ${
            isSidebarOpen ? styles.iconToggleActive : ""
          }`}
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Hide File Explorer" : "Show File Explorer"}
          title={isSidebarOpen ? "Hide File Explorer" : "Show File Explorer"}
        >
          <SidebarIcon size={16} />
        </button>

        <Link href="/" className={styles.backButton}>
          <ArrowLeft size={15} />
          <span>Workspaces</span>
        </Link>

        <span className={styles.divider} aria-hidden="true">
          /
        </span>
        <span className={styles.workspaceName} title={workspaceName}>
          {workspaceName}
        </span>

        {onRenameWorkspace && (
          <button
            type="button"
            className={styles.renameButton}
            onClick={handleOpenRename}
            title="Rename workspace"
            aria-label="Rename workspace"
          >
            <Edit2 size={12} />
          </button>
        )}

        {/* Phase 7B / 7B.1: Truthful Save Status Indicator */}
        <div className={styles.saveIndicatorWrapper}>
          {saveStatus === "saving" && (
            <div className={styles.saveStatusSaving} title="Saving changes...">
              <Loader2 size={11} className={styles.spin} />
              <span>Saving...</span>
            </div>
          )}
          {saveStatus === "saved" && (
            <div
              className={styles.saveStatusSaved}
              title={lastSavedAt ? `Saved to persistent database at ${lastSavedAt}` : "All changes saved to persistent database"}
            >
              <Check size={11} />
              <span>Saved (Cloud)</span>
            </div>
          )}
          {saveStatus === "saved-local" && (
            <button
              type="button"
              className={styles.saveStatusLocal}
              onClick={onSave}
              title={lastSavedAt ? `Saved locally in browser cache at ${lastSavedAt}. Remote database is disconnected. Click to retry cloud sync.` : "Saved locally in browser cache. Click to retry cloud sync."}
            >
              <HardDrive size={11} />
              <span>Saved (Local Only)</span>
            </button>
          )}
          {saveStatus === "unsaved" && (
            <button
              type="button"
              className={styles.saveStatusUnsaved}
              onClick={onSave}
              title="Unsaved changes. Click to save now (or press Ctrl+S)"
            >
              <CloudUpload size={11} />
              <span>Save</span>
            </button>
          )}
          {saveStatus === "error" && (
            <button
              type="button"
              className={styles.saveStatusError}
              onClick={onSave}
              title="Save to database failed. Local edits are preserved. Click to retry."
            >
              <AlertCircle size={11} />
              <span>Save Failed (Retry)</span>
            </button>
          )}
        </div>
      </div>


      {/* Center: Language Selector */}
      <div className={styles.center}>
        <div className={styles.langSelector}>
          <label htmlFor="workspace-lang-select" className={styles.langLabel}>
            Language:
          </label>
          <select
            id="workspace-lang-select"
            className={styles.select}
            value={language}
            onChange={(e) =>
              onLanguageChange(e.target.value as ProgrammingLanguage)
            }
          >
            <option value="python">Python 3</option>
            <option value="c">C (GCC C11)</option>
            <option value="javascript">JavaScript (Node)</option>
            <option value="html-css">HTML &amp; CSS</option>
          </select>
        </div>

        <div className={styles.badgeWrapper}>
          <Badge variant="teal" withDot>
            OneCompiler API
          </Badge>
        </div>
      </div>

      {/* Right: Actions */}
      <div className={styles.right}>
        <button
          type="button"
          className={`${styles.iconToggle} ${
            isOutputOpen ? styles.iconToggleActive : ""
          }`}
          onClick={onToggleOutput}
          aria-label={isOutputOpen ? "Hide Output Panel" : "Show Output Panel"}
          title={isOutputOpen ? "Hide Output Panel" : "Show Output Panel"}
        >
          <Terminal size={15} />
        </button>

        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RotateCcw size={13} />}
          onClick={onReset}
          disabled={isRunning || isGeneratingPseudocode || isGeneratingExplanation}
          title="Reset current file to starter template"
        >
          Reset
        </Button>

        {onGeneratePseudocode && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Sparkles size={13} color="var(--accent-text)" />}
            isLoading={isGeneratingPseudocode}
            onClick={onGeneratePseudocode}
            disabled={isGeneratingPseudocode || isGeneratingExplanation || isRunning}
            title="Generate beginner-friendly pseudocode with Gemini AI"
          >
            {isGeneratingPseudocode ? "Translating..." : "Generate Pseudocode"}
          </Button>
        )}

        {onExplainCode && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<BookOpen size={13} color="var(--accent-text)" />}
            isLoading={isGeneratingExplanation}
            onClick={onExplainCode}
            disabled={isGeneratingExplanation || isGeneratingPseudocode || isRunning}
            title="Generate line-by-line code explanation with Gemini AI"
          >
            {isGeneratingExplanation ? "Explaining..." : "Explain Code"}
          </Button>
        )}

        <Button
          variant="primary"
          size="sm"
          leftIcon={!isRunning ? <Play size={13} /> : undefined}
          isLoading={isRunning}
          onClick={onRun}
          disabled={isRunDisabled || isRunning}
          title={isRunning ? "Executing code in remote sandbox..." : "Execute code via OneCompiler sandbox"}
        >
          {isRunning ? "Running..." : "Run"}
        </Button>
      </div>

      {/* Rename Project Modal */}
      {isRenameOpen && (
        <Modal
          isOpen={isRenameOpen}
          onClose={() => setIsRenameOpen(false)}
          title="Rename Project"
        >
          <form onSubmit={handleSaveRename} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Input
              label="Project Name"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="e.g. My Algorithm Lab"
              autoFocus
              maxLength={100}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
              <Button type="button" variant="secondary" onClick={() => setIsRenameOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={!renameValue.trim()}>
                Save Name
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </header>
  );
}


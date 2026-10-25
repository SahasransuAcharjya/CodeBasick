"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Play,
  RotateCcw,
  Sidebar as SidebarIcon,
  Sparkles,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgrammingLanguage } from "./workspace.types";
import styles from "./WorkspaceToolbar.module.css";

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
}: WorkspaceToolbarProps) {
  return (
    <header className={styles.toolbar}>
      {/* Left: Navigation and Workspace Name */}
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
    </header>
  );
}

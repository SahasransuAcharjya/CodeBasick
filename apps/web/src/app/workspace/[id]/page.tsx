"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  FileCode,
  Terminal,
  Sparkles,
  Info,
  Play,
  RotateCcw,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Badge } from "@/components/ui";
import { getWorkspaceById } from "@/lib/storage";
import { Workspace } from "@/types";
import styles from "./Workspace.module.css";

function WorkspaceViewInner() {
  const params = useParams();
  const id = params?.id as string;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const found = getWorkspaceById(id);
      if (found) {
        setWorkspace(found);
      }
    }
    setIsLoading(false);
  }, [id]);

  const defaultFileName =
    workspace?.language === "python"
      ? "main.py"
      : workspace?.language === "javascript"
      ? "index.js"
      : "index.html";

  const sampleSnippet =
    workspace?.language === "python"
      ? `# CodeBasick Python Workspace: ${workspace?.name || ""}\n\ndef greet(name: str):\n    return f"Hello, {name}! Welcome to CodeBasick."\n\nif __name__ == "__main__":\n    print(greet("Learner"))`
      : workspace?.language === "javascript"
      ? `// CodeBasick JavaScript Workspace: ${workspace?.name || ""}\n\nfunction greet(name) {\n    return \`Hello, \${name}! Welcome to CodeBasick.\`;\n}\n\nconsole.log(greet("Learner"));`
      : `<!-- CodeBasick HTML/CSS Workspace -->\n<!DOCTYPE html>\n<html>\n  <body>\n    <h1>Welcome to CodeBasick</h1>\n  </body>\n</html>`;

  return (
    <AppShell>
      <div className={styles.workspaceView}>
        {/* Workspace Top Bar */}
        <div className={styles.topBar}>
          <div className={styles.titleArea}>
            <Link href="/" className={styles.backButton}>
              <ArrowLeft size={16} />
              <span>Workspaces</span>
            </Link>
            <span style={{ color: "var(--border-default)" }}>|</span>
            <h1 className={styles.heading}>
              {workspace ? workspace.name : isLoading ? "Loading..." : "Workspace"}
            </h1>
            {workspace && <Badge variant="teal">{workspace.language.toUpperCase()}</Badge>}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw size={14} />}
              disabled
              title="Code execution enabled in Phase 5"
            >
              Reset
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Play size={14} />}
              disabled
              title="Code execution enabled in Phase 5"
            >
              Run Code
            </Button>
          </div>
        </div>

        {/* 3-Panel IDE Layout Preview */}
        <div className={styles.ideContainer}>
          {/* Panel 1: File Explorer */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span>Files</span>
            </div>
            <div className={styles.panelBody}>
              <div className={styles.fileItem}>
                <FileCode size={14} color="var(--accent-primary)" />
                <span>{defaultFileName}</span>
              </div>
            </div>
          </div>

          {/* Panel 2: Editor Interim Area */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span>Editor</span>
              <Badge variant="neutral">Phase 3 Preview</Badge>
            </div>
            <div className={styles.panelBody}>
              <div className={styles.editorInterim}>
                <Info size={28} color="var(--accent-text)" style={{ marginBottom: "0.5rem" }} />
                <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  Monaco Editor Integrates in Phase 4
                </h2>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", maxWidth: "420px", marginTop: "0.25rem" }}>
                  This panel establishes the IDE shell layout. In Phase 4, the full interactive Monaco Editor with syntax highlighting and autocompletion will replace this placeholder.
                </p>

                <div className={styles.codeMock}>
                  <code>{sampleSnippet}</code>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 3: AI Assistant & Terminal Outline */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Sparkles size={14} color="var(--accent-text)" />
                AI Assistant
              </span>
            </div>
            <div className={styles.panelBody}>
              <div className={styles.assistantNotice}>
                <strong>Beginner-Friendly AI Tutor</strong>
                <p style={{ marginTop: "0.25rem" }}>
                  Integrates in Phase 6 to explain syntax, review code, and provide hints without giving away solutions directly.
                </p>
              </div>

              <div style={{ marginTop: "auto", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                  <Terminal size={14} />
                  <span>Output Terminal (Phase 5)</span>
                </div>
                <div style={{ background: "var(--bg-canvas)", padding: "0.5rem", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)" }}>
                  Waiting for execution...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "2rem", color: "var(--text-secondary)", textAlign: "center" }}>
          Loading workspace...
        </div>
      }
    >
      <WorkspaceViewInner />
    </Suspense>
  );
}

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Workspace, WorkspaceFile } from "@/types";
import {
  ProgrammingLanguage,
  OutputMessage,
  DiagnosticItem,
  ExecutionStatusState,
  ExecuteApiResponse,
} from "./workspace.types";
import {
  getStarterFileForLanguage,
  STARTER_SNIPPETS,
} from "./workspace.constants";
import { updateWorkspace, getPreferences } from "@/lib/storage";
import { WorkspaceToolbar } from "./WorkspaceToolbar";
import { FileExplorer } from "./FileExplorer";
import { EditorTabs } from "./EditorTabs";
import { CodeEditor } from "./CodeEditor";
import { OutputPanel } from "./OutputPanel";
import styles from "./WorkspaceShell.module.css";

export interface WorkspaceShellProps {
  initialWorkspace: Workspace;
}

export function WorkspaceShell({ initialWorkspace }: WorkspaceShellProps) {
  // Ensure files are initialized
  const initialFiles = useMemo(() => {
    if (initialWorkspace.files && initialWorkspace.files.length > 0) {
      return initialWorkspace.files;
    }
    return [getStarterFileForLanguage(initialWorkspace.language)];
  }, [initialWorkspace]);

  const [files, setFiles] = useState<WorkspaceFile[]>(initialFiles);
  const [activeFileId, setActiveFileId] = useState<string>(
    initialWorkspace.activeFileId || initialFiles[0].id
  );
  const [openFileIds, setOpenFileIds] = useState<string[]>(
    initialWorkspace.openFileIds || [initialFiles[0].id]
  );
  const [language, setLanguage] = useState<ProgrammingLanguage>(
    initialWorkspace.language
  );

  // Layout UI Toggles
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Preferences
  const [fontSize, setFontSize] = useState(14);
  const [tabSize, setTabSize] = useState(4);
  const [wordWrap, setWordWrap] = useState(true);

  // Console Output & Diagnostics
  const [logs, setLogs] = useState<OutputMessage[]>([
    {
      id: "log_init",
      type: "notice",
      text: `CodeBasick IDE initialized for workspace "${initialWorkspace.name}". Ready for editing.`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([]);

  // Execution Status State
  const [status, setStatus] = useState<ExecutionStatusState>({
    target: language === "c" ? "C (GCC C11)" : "Python 3.13",
    state: "ready",
    lastRunAt: null,
    exitCode: null,
    lineCount: initialFiles[0]?.content.split("\n").length || 0,
    byteCount: initialFiles[0]?.content.length || 0,
  });

  // Load Preferences & Responsive Layout on Mount
  useEffect(() => {
    const prefs = getPreferences();
    setFontSize(prefs.fontSize || 14);
    setTabSize(prefs.tabSize || 4);
    setWordWrap(prefs.wordWrap ?? true);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Sync state changes with persistence
  const syncWorkspace = useCallback(
    (
      currentFiles: WorkspaceFile[],
      currentActiveId: string,
      currentOpenIds: string[],
      currentLang: ProgrammingLanguage
    ) => {
      const updated: Workspace = {
        ...initialWorkspace,
        files: currentFiles,
        activeFileId: currentActiveId,
        openFileIds: currentOpenIds,
        language: currentLang,
        fileCount: currentFiles.length,
      };
      updateWorkspace(updated);
    },
    [initialWorkspace]
  );

  // Active File Reference
  const activeFile = useMemo(() => {
    return files.find((f) => f.id === activeFileId) || files[0];
  }, [files, activeFileId]);

  // Handle Tab Selection
  const handleSelectFile = useCallback(
    (fileId: string) => {
      setActiveFileId(fileId);
      if (!openFileIds.includes(fileId)) {
        const nextOpen = [...openFileIds, fileId];
        setOpenFileIds(nextOpen);
        syncWorkspace(files, fileId, nextOpen, language);
      } else {
        syncWorkspace(files, fileId, openFileIds, language);
      }
    },
    [files, openFileIds, language, syncWorkspace]
  );

  // Handle Close Tab
  const handleCloseTab = useCallback(
    (fileId: string) => {
      if (openFileIds.length <= 1) return; // Keep at least 1 tab open
      const nextOpen = openFileIds.filter((id) => id !== fileId);
      let nextActive = activeFileId;
      if (activeFileId === fileId) {
        nextActive = nextOpen[nextOpen.length - 1];
      }
      setOpenFileIds(nextOpen);
      setActiveFileId(nextActive);
      syncWorkspace(files, nextActive, nextOpen, language);
    },
    [openFileIds, activeFileId, files, language, syncWorkspace]
  );

  // Handle Add File
  const handleAddFile = useCallback(
    (newFile: WorkspaceFile) => {
      const nextFiles = [...files, newFile];
      const nextOpen = [...openFileIds, newFile.id];
      setFiles(nextFiles);
      setOpenFileIds(nextOpen);
      setActiveFileId(newFile.id);
      syncWorkspace(nextFiles, newFile.id, nextOpen, language);

      setLogs((prev) => [
        ...prev,
        {
          id: `log_add_${Date.now()}`,
          type: "info",
          text: `Created new file "${newFile.name}".`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    },
    [files, openFileIds, language, syncWorkspace]
  );

  // Handle Delete File
  const handleDeleteFile = useCallback(
    (fileId: string) => {
      if (files.length <= 1) return; // Prevent deleting the only file
      const deletedFile = files.find((f) => f.id === fileId);
      const nextFiles = files.filter((f) => f.id !== fileId);
      const nextOpen = openFileIds.filter((id) => id !== fileId);
      let nextActive = activeFileId;
      if (activeFileId === fileId) {
        nextActive = nextFiles[0].id;
      }
      if (!nextOpen.includes(nextActive)) {
        nextOpen.push(nextActive);
      }
      setFiles(nextFiles);
      setOpenFileIds(nextOpen);
      setActiveFileId(nextActive);
      syncWorkspace(nextFiles, nextActive, nextOpen, language);

      if (deletedFile) {
        setLogs((prev) => [
          ...prev,
          {
            id: `log_del_${Date.now()}`,
            type: "warning",
            text: `Deleted file "${deletedFile.name}".`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    },
    [files, openFileIds, activeFileId, language, syncWorkspace]
  );

  // Handle Code Changes in Monaco
  const handleCodeChange = useCallback(
    (newCode: string) => {
      setFiles((prevFiles) => {
        const nextFiles = prevFiles.map((f) =>
          f.id === activeFileId ? { ...f, content: newCode } : f
        );
        syncWorkspace(nextFiles, activeFileId, openFileIds, language);
        return nextFiles;
      });
    },
    [activeFileId, openFileIds, language, syncWorkspace]
  );

  // Handle Language Switching (C <-> Python <-> Others)
  // Preserves existing code buffers without overwriting!
  const handleLanguageChange = useCallback(
    (newLang: ProgrammingLanguage) => {
      setLanguage(newLang);
      const targetRuntime = newLang === "c" ? "GCC C11" : "Python 3.13";

      // Check if a file matching this language already exists
      const existingFile = files.find((f) => f.language === newLang);

      if (existingFile) {
        // Switch to the existing file buffer, preserving its code
        setActiveFileId(existingFile.id);
        if (!openFileIds.includes(existingFile.id)) {
          const nextOpen = [...openFileIds, existingFile.id];
          setOpenFileIds(nextOpen);
          syncWorkspace(files, existingFile.id, nextOpen, newLang);
        } else {
          syncWorkspace(files, existingFile.id, openFileIds, newLang);
        }

        setLogs((prev) => [
          ...prev,
          {
            id: `log_lang_${Date.now()}`,
            type: "info",
            text: `Switched language to ${newLang.toUpperCase()}. Activated existing file "${existingFile.name}".`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      } else {
        // Create a new starter file for the chosen language
        const starter = getStarterFileForLanguage(newLang);
        const nextFiles = [...files, starter];
        const nextOpen = [...openFileIds, starter.id];
        setFiles(nextFiles);
        setOpenFileIds(nextOpen);
        setActiveFileId(starter.id);
        syncWorkspace(nextFiles, starter.id, nextOpen, newLang);

        setLogs((prev) => [
          ...prev,
          {
            id: `log_lang_${Date.now()}`,
            type: "info",
            text: `Switched language to ${newLang.toUpperCase()}. Created starter file "${starter.name}". Existing code in other files preserved.`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }

      setStatus((prev) => ({
        ...prev,
        target: targetRuntime,
      }));
    },
    [files, openFileIds, syncWorkspace]
  );

  // Handle Run Button Click (Calls FastAPI /api/v1/execute)
  const handleRun = useCallback(async () => {
    const lines = activeFile.content.split("\n").length;
    const bytes = new Blob([activeFile.content]).size;
    const now = new Date().toLocaleTimeString();

    // Expand output panel so feedback is immediately visible
    setIsOutputCollapsed(false);

    // Validate supported execution languages (C and Python)
    if (activeFile.language !== "c" && activeFile.language !== "python") {
      setLogs((prev) => [
        ...prev,
        {
          id: `run_unsupported_${Date.now()}`,
          type: "warning",
          text: `[Language Note] OneCompiler remote execution currently supports C and Python. Language "${activeFile.language}" execution will arrive in a subsequent update.`,
          timestamp: now,
        },
      ]);
      setStatus((prev) => ({
        ...prev,
        state: "unconfigured",
        lastRunAt: now,
        message: `Language '${activeFile.language}' execution is not supported by OneCompiler runner.`,
      }));
      return;
    }

    setIsRunning(true);
    setStatus({
      target: activeFile.language === "c" ? "C (GCC C11)" : "Python 3.13",
      state: "running",
      lastRunAt: now,
      exitCode: null,
      lineCount: lines,
      byteCount: bytes,
    });

    setLogs((prev) => [
      ...prev,
      {
        id: `run_start_${Date.now()}`,
        type: "status",
        text: `[OneCompiler] Submitting "${activeFile.name}" to cloud execution sandbox (${lines} lines, ${bytes} bytes)...`,
        timestamp: now,
      },
    ]);

    // Build payload with relevant project files for multi-file support
    const relevantFiles = files
      .filter((f) => {
        if (activeFile.language === "c") {
          return f.name.endsWith(".c") || f.name.endsWith(".h");
        }
        if (activeFile.language === "python") {
          return f.name.endsWith(".py");
        }
        return false;
      })
      .map((f) => ({ name: f.name, content: f.content }));

    const payload = {
      language: activeFile.language,
      code: activeFile.content,
      filename: activeFile.name,
      files: relevantFiles.length > 0 ? relevantFiles : undefined,
    };

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      const res = await fetch(`${apiUrl}/api/v1/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseTime = new Date().toLocaleTimeString();

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errorMsg =
          errorData?.error ||
          errorData?.message ||
          `Execution request failed with HTTP ${res.status}`;

        setLogs((prev) => [
          ...prev,
          {
            id: `run_err_${Date.now()}`,
            type: "error",
            text: `[Provider Error] ${errorMsg}`,
            timestamp: responseTime,
          },
        ]);

        setStatus((prev) => ({
          ...prev,
          state: "error",
          lastRunAt: responseTime,
          message: errorMsg,
        }));
        return;
      }

      const data: ExecuteApiResponse = await res.json();

      // Handle unconfigured API key
      if (data.status === "unconfigured") {
        setLogs((prev) => [
          ...prev,
          {
            id: `run_unconfigured_${Date.now()}`,
            type: "warning",
            text: `[Configuration Notice] ${
              data.message ||
              "OneCompiler API key is not configured on the backend server. Set ONECOMPILER_API_KEY in apps/api/.env to enable live execution."
            }`,
            timestamp: responseTime,
          },
        ]);
        setStatus((prev) => ({
          ...prev,
          state: "unconfigured",
          lastRunAt: responseTime,
          message: data.message,
        }));
        return;
      }

      // Handle execution timeout
      if (data.status === "timeout") {
        setLogs((prev) => [
          ...prev,
          {
            id: `run_timeout_${Date.now()}`,
            type: "error",
            text: `[Execution Timeout] ${data.exception || "Execution timed out."}`,
            timestamp: responseTime,
          },
        ]);
        setStatus((prev) => ({
          ...prev,
          state: "timeout",
          lastRunAt: responseTime,
        }));
        return;
      }

      // Display actual stdout if returned
      if (data.stdout) {
        const stdoutLines = data.stdout.replace(/\r\n/g, "\n").split("\n");
        if (stdoutLines.length > 1 && stdoutLines[stdoutLines.length - 1] === "") {
          stdoutLines.pop();
        }
        setLogs((prev) => [
          ...prev,
          ...stdoutLines.map((line, idx) => ({
            id: `stdout_${Date.now()}_${idx}`,
            type: "info" as const,
            text: line,
            timestamp: responseTime,
          })),
        ]);
      }

      // Display actual stderr if returned
      if (data.stderr) {
        const stderrLines = data.stderr.replace(/\r\n/g, "\n").split("\n");
        if (stderrLines.length > 1 && stderrLines[stderrLines.length - 1] === "") {
          stderrLines.pop();
        }
        setLogs((prev) => [
          ...prev,
          ...stderrLines.map((line, idx) => ({
            id: `stderr_${Date.now()}_${idx}`,
            type: "error" as const,
            text: line,
            timestamp: responseTime,
          })),
        ]);

        // Parse compilation diagnostics if available
        const newDiags: DiagnosticItem[] = [];
        for (const line of stderrLines) {
          const match = line.match(/^([^:]+):(\d+):(?:\d+:)?\s*(error|warning):\s*(.*)$/i);
          if (match) {
            newDiags.push({
              id: `diag_${Date.now()}_${newDiags.length}`,
              source: match[1],
              line: parseInt(match[2], 10),
              severity: match[3].toLowerCase() === "error" ? "error" : "warning",
              message: match[4],
            });
          }
        }
        if (newDiags.length > 0) {
          setDiagnostics((prev) => [...prev, ...newDiags]);
        }
      }

      // Display runtime exception if returned
      if (data.exception) {
        setLogs((prev) => [
          ...prev,
          {
            id: `exception_${Date.now()}`,
            type: "error",
            text: `[Runtime Exception] ${data.exception}`,
            timestamp: responseTime,
          },
        ]);
      }

      // Provide completion summary if no stdout and no stderr
      if (data.status === "success" && !data.stdout && !data.stderr) {
        setLogs((prev) => [
          ...prev,
          {
            id: `run_done_${Date.now()}`,
            type: "status",
            text: `[Execution Finished] Exit code 0 (no output produced).`,
            timestamp: responseTime,
          },
        ]);
      }

      // Update final execution status metrics
      setStatus({
        target: activeFile.language === "c" ? "C (GCC C11)" : "Python 3.13",
        state: data.status === "failed" ? "failed" : "success",
        lastRunAt: responseTime,
        exitCode: data.status === "success" ? 0 : 1,
        lineCount: lines,
        byteCount: bytes,
        executionTime: data.executionTime,
        compilationTime: data.compilationTime,
        memoryUsed: data.memoryUsed,
      });
    } catch (networkErr: unknown) {
      const errTime = new Date().toLocaleTimeString();
      const errMessage =
        networkErr instanceof Error ? networkErr.message : "Network error";
      setLogs((prev) => [
        ...prev,
        {
          id: `net_err_${Date.now()}`,
          type: "error",
          text: `[Connection Error] Could not connect to API server at ${apiUrl} (${errMessage}). Ensure the FastAPI server is running on port 8000.`,
          timestamp: errTime,
        },
      ]);
      setStatus((prev) => ({
        ...prev,
        state: "error",
        lastRunAt: errTime,
        message: errMessage,
      }));
    } finally {
      setIsRunning(false);
    }
  }, [activeFile, files]);

  // Handle Reset to Starter Template
  const handleReset = useCallback(() => {
    if (
      window.confirm(
        `Reset "${activeFile.name}" to the starter template for ${activeFile.language.toUpperCase()}? This will replace your current edits in this file.`
      )
    ) {
      const template = STARTER_SNIPPETS[activeFile.language]?.code || "";
      handleCodeChange(template);
      setLogs((prev) => [
        ...prev,
        {
          id: `log_reset_${Date.now()}`,
          type: "warning",
          text: `Reset file "${activeFile.name}" to starter template.`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  }, [activeFile, handleCodeChange]);

  return (
    <div className={styles.shell}>
      {/* Top Toolbar */}
      <WorkspaceToolbar
        workspaceName={initialWorkspace.name}
        language={language}
        onLanguageChange={handleLanguageChange}
        onRun={handleRun}
        onReset={handleReset}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isOutputOpen={!isOutputCollapsed}
        onToggleOutput={() => setIsOutputCollapsed(!isOutputCollapsed)}
        isRunning={isRunning}
      />

      {/* Main Workspace Body */}
      <div className={styles.workspaceBody}>
        {/* Left: File Explorer Sidebar */}
        {isSidebarOpen && (
          <FileExplorer
            files={files}
            activeFileId={activeFileId}
            onSelectFile={handleSelectFile}
            onAddFile={handleAddFile}
            onDeleteFile={handleDeleteFile}
          />
        )}

        {/* Center: Tabs + Monaco Editor + Bottom Output */}
        <div className={styles.centerArea}>
          <EditorTabs
            files={files}
            openFileIds={openFileIds}
            activeFileId={activeFileId}
            onSelectTab={handleSelectFile}
            onCloseTab={handleCloseTab}
          />

          <div className={styles.editorArea}>
            <CodeEditor
              file={activeFile}
              onChange={handleCodeChange}
              fontSize={fontSize}
              tabSize={tabSize}
              wordWrap={wordWrap}
            />
          </div>

          {/* Bottom Output Panel */}
          <OutputPanel
            logs={logs}
            diagnostics={diagnostics}
            status={status}
            onClearLogs={() => setLogs([])}
            isCollapsed={isOutputCollapsed}
            onToggleCollapse={() => setIsOutputCollapsed(!isOutputCollapsed)}
          />
        </div>
      </div>
    </div>
  );
}

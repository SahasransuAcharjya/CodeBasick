"use client";

import React, { useRef, useCallback } from "react";
import Editor, { OnMount, BeforeMount, Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { WorkspaceFile } from "./workspace.types";
import { getMonacoLanguage } from "./workspace.constants";
import styles from "./CodeEditor.module.css";

export interface CodeEditorProps {
  file: WorkspaceFile;
  onChange: (value: string) => void;
  fontSize?: number;
  tabSize?: number;
  wordWrap?: boolean;
}

export function CodeEditor({
  file,
  onChange,
  fontSize = 14,
  tabSize = 4,
  wordWrap = true,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleBeforeMount: BeforeMount = useCallback((monaco: Monaco) => {
    // Define CodeBasick Dark Theme matching design system tokens
    monaco.editor.defineTheme("codebasick-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6b7280", fontStyle: "italic" },
        { token: "keyword", foreground: "34d399", fontStyle: "bold" },
        { token: "string", foreground: "6ee7b7" },
        { token: "number", foreground: "fbbf24" },
        { token: "type", foreground: "38bdf8" },
        { token: "function", foreground: "93c5fd" },
      ],
      colors: {
        "editor.background": "#0b0c0e",
        "editor.foreground": "#f3f4f6",
        "editor.lineHighlightBackground": "#15181e",
        "editorLineNumber.foreground": "#4b5563",
        "editorLineNumber.activeForeground": "#10b981",
        "editorIndentGuide.background": "#1c2027",
        "editorIndentGuide.activeBackground": "#262b35",
        "editorCursor.foreground": "#10b981",
        "editor.selectionBackground": "#1e3a34",
        "editorWidget.background": "#15181e",
        "editorWidget.border": "#262b35",
        "editorGutter.background": "#0b0c0e",
      },
    });
  }, []);

  const handleOnMount: OnMount = useCallback(
    (editorInstance: editor.IStandaloneCodeEditor) => {
      editorRef.current = editorInstance;
      editorInstance.focus();
    },
    []
  );

  const monacoLang = getMonacoLanguage(file.language);

  return (
    <div className={styles.editorContainer}>
      <Editor
        key={file.id} // Ensures distinct model isolation per file buffer
        theme="codebasick-dark"
        language={monacoLang}
        value={file.content}
        onChange={(val) => onChange(val || "")}
        beforeMount={handleBeforeMount}
        onMount={handleOnMount}
        loading={
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner} aria-hidden="true" />
            <span>Initializing CodeBasick Editor...</span>
          </div>
        }
        options={{
          automaticLayout: true,
          fontSize: fontSize,
          tabSize: tabSize,
          wordWrap: wordWrap ? "on" : "off",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: "on",
          renderLineHighlight: "all",
          bracketPairColorization: { enabled: true },
          fontFamily:
            "var(--font-geist-mono), Consolas, Monaco, 'Courier New', monospace",
          lineHeight: 22,
          padding: { top: 12, bottom: 12 },
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          fixedOverflowWidgets: true,
        }}
      />
    </div>
  );
}

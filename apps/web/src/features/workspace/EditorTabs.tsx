"use client";

import React from "react";
import { X, FileCode } from "lucide-react";
import { WorkspaceFile } from "./workspace.types";
import styles from "./EditorTabs.module.css";

export interface EditorTabsProps {
  files: WorkspaceFile[];
  openFileIds: string[];
  activeFileId: string;
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
}

export function EditorTabs({
  files,
  openFileIds,
  activeFileId,
  onSelectTab,
  onCloseTab,
}: EditorTabsProps) {
  const openFiles = openFileIds
    .map((id) => files.find((f) => f.id === id))
    .filter((f): f is WorkspaceFile => f !== undefined);

  if (openFiles.length === 0) return null;

  return (
    <div className={styles.tabBar} role="tablist" aria-label="Open editor files">
      {openFiles.map((file) => {
        const isActive = file.id === activeFileId;
        return (
          <div
            key={file.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={0}
            className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
            onClick={() => onSelectTab(file.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectTab(file.id);
              }
            }}
          >
            <span className={styles.fileName}>
              <FileCode
                size={14}
                color={isActive ? "var(--accent-primary)" : "var(--text-muted)"}
              />
              <span>{file.name}</span>
            </span>

            {openFiles.length > 1 && (
              <button
                type="button"
                className={styles.closeButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(file.id);
                }}
                aria-label={`Close ${file.name}`}
              >
                <X size={12} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

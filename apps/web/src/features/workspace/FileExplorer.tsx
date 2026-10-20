"use client";

import React, { useState } from "react";
import { FileCode, Plus, Trash2 } from "lucide-react";
import { Modal, Input, Button } from "@/components/ui";
import { WorkspaceFile } from "./workspace.types";
import { detectLanguageFromFilename } from "./workspace.constants";
import styles from "./FileExplorer.module.css";

export interface FileExplorerProps {
  files: WorkspaceFile[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onAddFile: (file: WorkspaceFile) => void;
  onDeleteFile: (fileId: string) => void;
}

export function FileExplorer({
  files,
  activeFileId,
  onSelectFile,
  onAddFile,
  onDeleteFile,
}: FileExplorerProps) {
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [error, setError] = useState("");

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFileName.trim();

    if (!trimmed) {
      setError("File name is required.");
      return;
    }

    // Check duplicate
    if (files.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
      setError("A file with this name already exists.");
      return;
    }

    // Check supported extension
    const hasValidExt = /\.(c|h|py|js|ts|html|css|txt)$/i.test(trimmed);
    if (!hasValidExt) {
      setError("Please include a supported extension (.c, .h, .py, .js, .html).");
      return;
    }

    const language = detectLanguageFromFilename(trimmed);
    const newFile: WorkspaceFile = {
      id: `file_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      language,
      content: language === "c" ? "// " + trimmed + "\n" : "# " + trimmed + "\n",
      isStarter: false,
    };

    onAddFile(newFile);
    setIsNewFileModalOpen(false);
    setNewFileName("");
    setError("");
  };

  return (
    <>
      <div className={styles.explorer}>
        <div className={styles.header}>
          <span className={styles.title}>Files</span>
          <button
            type="button"
            className={styles.addButton}
            onClick={() => setIsNewFileModalOpen(true)}
            aria-label="Create new file"
            title="Create new file"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className={styles.fileList} role="tree" aria-label="Project files">
          {files.map((file) => {
            const isActive = file.id === activeFileId;
            return (
              <div
                key={file.id}
                role="treeitem"
                aria-selected={isActive}
                tabIndex={0}
                className={`${styles.fileItem} ${isActive ? styles.fileItemActive : ""}`}
                onClick={() => onSelectFile(file.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectFile(file.id);
                  }
                }}
              >
                <div className={styles.fileLabel}>
                  <FileCode
                    size={14}
                    color={isActive ? "var(--accent-primary)" : "var(--text-muted)"}
                  />
                  <span>{file.name}</span>
                </div>

                {files.length > 1 && (
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete file "${file.name}"?`)) {
                        onDeleteFile(file.id);
                      }
                    }}
                    aria-label={`Delete ${file.name}`}
                    title="Delete file"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* New File Modal */}
      <Modal
        isOpen={isNewFileModalOpen}
        onClose={() => {
          setIsNewFileModalOpen(false);
          setError("");
        }}
        title="Add New File"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setIsNewFileModalOpen(false);
                setError("");
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateFile}>
              Add File
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateFile}>
          <Input
            label="File Name"
            placeholder="e.g. helpers.py or utils.c"
            value={newFileName}
            onChange={(e) => {
              setNewFileName(e.target.value);
              if (error) setError("");
            }}
            errorMessage={error}
            helperText="Include extension (e.g. .c, .h, .py, .js, .html)"
            required
            autoFocus
          />
        </form>
      </Modal>
    </>
  );
}

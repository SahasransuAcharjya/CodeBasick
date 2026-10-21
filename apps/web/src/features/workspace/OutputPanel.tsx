"use client";

import React, { useState } from "react";
import {
  Terminal,
  AlertTriangle,
  Activity,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  OutputMessage,
  DiagnosticItem,
  ExecutionStatusState,
} from "./workspace.types";
import styles from "./OutputPanel.module.css";

export interface OutputPanelProps {
  logs: OutputMessage[];
  diagnostics: DiagnosticItem[];
  status: ExecutionStatusState;
  onClearLogs: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function OutputPanel({
  logs,
  diagnostics,
  status,
  onClearLogs,
  isCollapsed,
  onToggleCollapse,
}: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState<"output" | "diagnostics" | "status">(
    "output"
  );

  return (
    <div
      className={`${styles.outputPanel} ${
        isCollapsed ? styles.outputPanelCollapsed : ""
      }`}
    >
      {/* Header with Tabs and Actions */}
      <div className={styles.header}>
        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "output"}
            className={`${styles.tab} ${
              activeTab === "output" ? styles.tabActive : ""
            }`}
            onClick={() => {
              setActiveTab("output");
              if (isCollapsed) onToggleCollapse();
            }}
          >
            <Terminal size={14} />
            <span>Output</span>
            {logs.length > 0 && <span>({logs.length})</span>}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "diagnostics"}
            className={`${styles.tab} ${
              activeTab === "diagnostics" ? styles.tabActive : ""
            }`}
            onClick={() => {
              setActiveTab("diagnostics");
              if (isCollapsed) onToggleCollapse();
            }}
          >
            <AlertTriangle size={14} />
            <span>Diagnostics</span>
            {diagnostics.length > 0 && <span>({diagnostics.length})</span>}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "status"}
            className={`${styles.tab} ${
              activeTab === "status" ? styles.tabActive : ""
            }`}
            onClick={() => {
              setActiveTab("status");
              if (isCollapsed) onToggleCollapse();
            }}
          >
            <Activity size={14} />
            <span>Status</span>
          </button>
        </div>

        <div className={styles.actions}>
          {activeTab === "output" && logs.length > 0 && !isCollapsed && (
            <button
              type="button"
              className={styles.actionButton}
              onClick={onClearLogs}
              aria-label="Clear output logs"
              title="Clear output"
            >
              <Trash2 size={13} />
            </button>
          )}

          <button
            type="button"
            className={styles.actionButton}
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand output panel" : "Collapse output panel"}
            title={isCollapsed ? "Expand output panel" : "Collapse output panel"}
          >
            {isCollapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Body Content */}
      {!isCollapsed && (
        <div className={styles.content} role="tabpanel">
          {activeTab === "output" && (
            <div>
              {logs.length === 0 ? (
                <p className={styles.emptyState}>
                  Terminal output is idle. Click &quot;Run&quot; above to check execution status.
                </p>
              ) : (
                logs.map((msg) => (
                  <div key={msg.id} className={styles.logEntry}>
                    <span className={styles.timestamp}>{msg.timestamp}</span>
                    <span className={styles[`msg_${msg.type}`]}>{msg.text}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "diagnostics" && (
            <div>
              {diagnostics.length === 0 ? (
                <p className={styles.emptyState}>No syntax diagnostics or errors reported.</p>
              ) : (
                diagnostics.map((diag) => (
                  <div key={diag.id} className={styles.logEntry}>
                    <span style={{ color: "var(--status-warning)" }}>
                      [{diag.severity.toUpperCase()}]
                    </span>
                    <span>
                      {diag.source}
                      {diag.line ? `:${diag.line}` : ""}: {diag.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "status" && (
            <div className={styles.statusTable}>
              <span className={styles.statusLabel}>Runtime Target:</span>
              <span className={styles.statusValue}>{status.target}</span>

              <span className={styles.statusLabel}>Execution Status:</span>
              <span className={styles.statusValue}>
                {status.state === "running" && "Executing via OneCompiler Sandbox..."}
                {status.state === "success" && "Execution Succeeded"}
                {status.state === "failed" && "Execution Finished with Errors"}
                {status.state === "timeout" && "Execution Timed Out"}
                {status.state === "unconfigured" && "OneCompiler API Key Not Configured (Set ONECOMPILER_API_KEY in apps/api/.env)"}
                {status.state === "error" && "Execution Request Error"}
                {status.state === "ready" && "Ready for Execution"}
                {status.state === "idle" && "Idle - Ready to execute"}
              </span>

              {status.executionTime != null && (
                <>
                  <span className={styles.statusLabel}>Execution Time:</span>
                  <span className={styles.statusValue}>{status.executionTime} ms</span>
                </>
              )}

              {status.compilationTime != null && status.compilationTime > 0 && (
                <>
                  <span className={styles.statusLabel}>Compilation Time:</span>
                  <span className={styles.statusValue}>{status.compilationTime} ms</span>
                </>
              )}

              {status.memoryUsed != null && (
                <>
                  <span className={styles.statusLabel}>Memory Used:</span>
                  <span className={styles.statusValue}>{status.memoryUsed} KB</span>
                </>
              )}

              <span className={styles.statusLabel}>Active Buffer:</span>
              <span className={styles.statusValue}>
                {status.lineCount} lines ({status.byteCount} bytes)
              </span>

              <span className={styles.statusLabel}>Last Run:</span>
              <span className={styles.statusValue}>
                {status.lastRunAt || "None"}
              </span>

              <span className={styles.statusLabel}>Execution Provider:</span>
              <span className={styles.statusValue}>
                OneCompiler Sandbox (api.onecompiler.com)
              </span>

              <span className={styles.statusLabel}>Security Mode:</span>
              <span className={styles.statusValue}>
                Remote Sandbox (In-Process execution prohibited)
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

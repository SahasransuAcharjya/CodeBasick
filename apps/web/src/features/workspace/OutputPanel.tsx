"use client";

import React, { useState } from "react";
import {
  Terminal,
  AlertTriangle,
  Activity,
  Trash2,
  ChevronDown,
  ChevronUp,
  Keyboard,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  RotateCcw,
  Info,
} from "lucide-react";
import {
  OutputMessage,
  DiagnosticItem,
  ExecutionStatusState,
  PseudocodeApiResponse,
  ExplainApiResponse,
} from "./workspace.types";
import styles from "./OutputPanel.module.css";

export type OutputPanelTab =
  | "output"
  | "stdin"
  | "pseudocode"
  | "explanation"
  | "diagnostics"
  | "status";

export interface OutputPanelProps {
  logs: OutputMessage[];
  diagnostics: DiagnosticItem[];
  status: ExecutionStatusState;
  onClearLogs: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  stdin?: string;
  onStdinChange?: (val: string) => void;
  // Phase 6: Gemini AI Tutoring
  activeTab?: OutputPanelTab;
  onTabChange?: (tab: OutputPanelTab) => void;
  pseudocodeData?: PseudocodeApiResponse | null;
  isGeneratingPseudocode?: boolean;
  pseudocodeError?: string | null;
  onRetryPseudocode?: () => void;
  explainData?: ExplainApiResponse | null;
  isGeneratingExplanation?: boolean;
  explainError?: string | null;
  onRetryExplain?: () => void;
}

export function OutputPanel({
  logs,
  diagnostics,
  status,
  onClearLogs,
  isCollapsed,
  onToggleCollapse,
  stdin = "",
  onStdinChange,
  activeTab: externalTab,
  onTabChange,
  pseudocodeData,
  isGeneratingPseudocode = false,
  pseudocodeError,
  onRetryPseudocode,
  explainData,
  isGeneratingExplanation = false,
  explainError,
  onRetryExplain,
}: OutputPanelProps) {
  const [internalTab, setInternalTab] = useState<OutputPanelTab>("output");
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasCopiedPseudocode, setHasCopiedPseudocode] = useState(false);

  const activeTab = externalTab ?? internalTab;

  const handleTabClick = (tab: OutputPanelTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
    if (isCollapsed) onToggleCollapse();
  };

  const handleCopyPseudocode = () => {
    if (pseudocodeData?.pseudocode) {
      navigator.clipboard.writeText(pseudocodeData.pseudocode);
      setHasCopiedPseudocode(true);
      setTimeout(() => setHasCopiedPseudocode(false), 2000);
    }
  };

  const panelHeightClass = isCollapsed
    ? styles.outputPanelCollapsed
    : isExpanded
    ? styles.outputPanelExpanded
    : "";

  return (
    <div className={`${styles.outputPanel} ${panelHeightClass}`}>
      {/* Header with Tabs and Actions */}
      <div className={styles.header}>
        <div className={styles.tabs} role="tablist">
          {/* Output Tab */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "output"}
            className={`${styles.tab} ${
              activeTab === "output" ? styles.tabActive : ""
            }`}
            onClick={() => handleTabClick("output")}
          >
            <Terminal size={14} />
            <span>Output</span>
            {logs.length > 0 && <span>({logs.length})</span>}
          </button>

          {/* Stdin Tab */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "stdin"}
            className={`${styles.tab} ${
              activeTab === "stdin" ? styles.tabActive : ""
            }`}
            onClick={() => handleTabClick("stdin")}
          >
            <Keyboard size={14} />
            <span>Input</span>
            {Boolean(stdin && stdin.trim()) && (
              <span style={{ color: "var(--accent-text)", fontSize: "0.7rem" }}>
                (set)
              </span>
            )}
          </button>

          {/* Pseudocode Tab (Gemini AI) */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "pseudocode"}
            className={`${styles.tab} ${
              activeTab === "pseudocode" ? styles.tabActive : ""
            }`}
            onClick={() => handleTabClick("pseudocode")}
          >
            <Sparkles size={14} />
            <span>Pseudocode</span>
            {isGeneratingPseudocode && <span>...</span>}
          </button>

          {/* Explanation Tab (Gemini AI) */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "explanation"}
            className={`${styles.tab} ${
              activeTab === "explanation" ? styles.tabActive : ""
            }`}
            onClick={() => handleTabClick("explanation")}
          >
            <BookOpen size={14} />
            <span>Explanation</span>
            {isGeneratingExplanation && <span>...</span>}
          </button>

          {/* Diagnostics Tab */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "diagnostics"}
            className={`${styles.tab} ${
              activeTab === "diagnostics" ? styles.tabActive : ""
            }`}
            onClick={() => handleTabClick("diagnostics")}
          >
            <AlertTriangle size={14} />
            <span>Diagnostics</span>
            {diagnostics.length > 0 && <span>({diagnostics.length})</span>}
          </button>

          {/* Status Tab */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "status"}
            className={`${styles.tab} ${
              activeTab === "status" ? styles.tabActive : ""
            }`}
            onClick={() => handleTabClick("status")}
          >
            <Activity size={14} />
            <span>Status</span>
          </button>
        </div>

        {/* Header Right Actions */}
        <div className={styles.actions}>
          {activeTab === "output" && (
            <button
              type="button"
              className={styles.actionButton}
              onClick={onClearLogs}
              title="Clear terminal output"
              aria-label="Clear terminal output"
            >
              <Trash2 size={13} />
            </button>
          )}

          {!isCollapsed && (
            <button
              type="button"
              className={styles.actionButton}
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Restore panel height" : "Expand panel height"}
              aria-label={isExpanded ? "Restore panel height" : "Expand panel height"}
            >
              {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}

          <button
            type="button"
            className={styles.actionButton}
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand panel" : "Collapse panel"}
            aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
          >
            {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Panel Content Body */}
      {!isCollapsed && (
        <div className={styles.content}>
          {/* TAB 1: OUTPUT */}
          {activeTab === "output" && (
            <div>
              {logs.length === 0 ? (
                <p className={styles.emptyState}>
                  Terminal output is idle. Click &quot;Run&quot; above to execute code.
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

          {/* TAB 2: STDIN */}
          {activeTab === "stdin" && (
            <div className={styles.stdinContainer}>
              <div className={styles.stdinHeader}>
                <span>Program Standard Input (stdin)</span>
                {stdin ? (
                  <button
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                    }}
                    onClick={() => onStdinChange && onStdinChange("")}
                  >
                    Clear Input
                  </button>
                ) : (
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Optional input passed to scanf() / input()
                  </span>
                )}
              </div>
              <textarea
                className={styles.stdinTextarea}
                placeholder="Type input passed to your program via standard input (e.g. for Python input() or C scanf)..."
                value={stdin}
                onChange={(e) => onStdinChange && onStdinChange(e.target.value)}
                spellCheck={false}
              />
            </div>
          )}

          {/* TAB 3: PSEUDOCODE (GEMINI AI) */}
          {activeTab === "pseudocode" && (
            <div className={styles.aiContainer}>
              {isGeneratingPseudocode ? (
                <div className={styles.aiLoading}>
                  <Sparkles size={24} color="var(--accent-text)" />
                  <div>
                    <strong style={{ color: "var(--text-primary)" }}>
                      Generating Beginner-Friendly Pseudocode...
                    </strong>
                    <p style={{ marginTop: "0.25rem", color: "var(--text-muted)" }}>
                      Gemini AI is analyzing loops, variables, and conditions in your code.
                    </p>
                  </div>
                </div>
              ) : pseudocodeError ? (
                <div className={styles.aiError}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <AlertTriangle size={16} />
                    <strong>Pseudocode Generation Error</strong>
                  </div>
                  <p style={{ fontSize: "0.8125rem", lineHeight: 1.4 }}>{pseudocodeError}</p>
                  {onRetryPseudocode && (
                    <button
                      type="button"
                      className={styles.aiRetryButton}
                      onClick={onRetryPseudocode}
                    >
                      <RotateCcw size={12} />
                      Retry Generation
                    </button>
                  )}
                </div>
              ) : !pseudocodeData ? (
                <div style={{ padding: "1.5rem 0", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                  <p style={{ marginBottom: "0.5rem" }}>
                    No pseudocode generated for the active file yet.
                  </p>
                  <p style={{ color: "var(--text-secondary)" }}>
                    Click &quot;<strong>Generate Pseudocode</strong>&quot; in the toolbar above to translate
                    your program into plain-English, structured pseudocode steps.
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary & Controls Header */}
                  <div className={styles.aiHeader}>
                    <div>
                      <div className={styles.aiOverviewTitle}>
                        <Sparkles size={14} color="var(--accent-text)" />
                        Program Logic Summary
                      </div>
                      <p className={styles.aiOverviewText}>{pseudocodeData.summary}</p>
                    </div>

                    <div className={styles.aiMetaGroup}>
                      <button
                        type="button"
                        className={styles.aiCopyButton}
                        onClick={handleCopyPseudocode}
                        title="Copy pseudocode to clipboard"
                      >
                        {hasCopiedPseudocode ? <Check size={12} /> : <Copy size={12} />}
                        <span>{hasCopiedPseudocode ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Warning if code was incomplete */}
                  {pseudocodeData.is_incomplete && pseudocodeData.limitations && (
                    <div className={styles.aiIncompleteBanner}>
                      <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
                      <div>
                        <strong>Incomplete / Partial Code Notice:</strong> {pseudocodeData.limitations}
                      </div>
                    </div>
                  )}

                  {/* Main Grid: Pseudocode Text + Step Breakdown */}
                  <div className={styles.pseudocodeGrid}>
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                        FORMATTED PSEUDOCODE
                      </div>
                      <div className={styles.pseudocodeBox}>
                        {pseudocodeData.pseudocode}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                        LOGICAL STEPS ({pseudocodeData.steps.length})
                      </div>
                      <div className={styles.stepsContainer}>
                        {pseudocodeData.steps.map((step) => (
                          <div key={step.step_number} className={styles.stepCard}>
                            <div className={styles.stepCardHeader}>
                              <div>
                                <span className={styles.stepNumber}>Step {step.step_number}</span>
                                <span className={styles.stepLabel}>{step.label}</span>
                              </div>
                              {step.line_reference && (
                                <span className={styles.stepLineRef}>{step.line_reference}</span>
                              )}
                            </div>
                            <p className={styles.stepDescription}>{step.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 4: EXPLANATION (GEMINI AI) */}
          {activeTab === "explanation" && (
            <div className={styles.aiContainer}>
              {isGeneratingExplanation ? (
                <div className={styles.aiLoading}>
                  <BookOpen size={24} color="var(--accent-text)" />
                  <div>
                    <strong style={{ color: "var(--text-primary)" }}>
                      Analyzing Code Line-by-Line...
                    </strong>
                    <p style={{ marginTop: "0.25rem", color: "var(--text-muted)" }}>
                      Gemini AI is examining syntax, variable roles, and pedagogical caveats.
                    </p>
                  </div>
                </div>
              ) : explainError ? (
                <div className={styles.aiError}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <AlertTriangle size={16} />
                    <strong>Code Explanation Error</strong>
                  </div>
                  <p style={{ fontSize: "0.8125rem", lineHeight: 1.4 }}>{explainError}</p>
                  {onRetryExplain && (
                    <button
                      type="button"
                      className={styles.aiRetryButton}
                      onClick={onRetryExplain}
                    >
                      <RotateCcw size={12} />
                      Retry Explanation
                    </button>
                  )}
                </div>
              ) : !explainData ? (
                <div style={{ padding: "1.5rem 0", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                  <p style={{ marginBottom: "0.5rem" }}>
                    No line-by-line explanation generated yet.
                  </p>
                  <p style={{ color: "var(--text-secondary)" }}>
                    Click &quot;<strong>Explain Code</strong>&quot; in the toolbar above for a structured,
                    pedagogical explanation of each statement in your program.
                  </p>
                </div>
              ) : (
                <>
                  {/* Overview Header */}
                  <div className={styles.aiHeader}>
                    <div>
                      <div className={styles.aiOverviewTitle}>
                        <BookOpen size={14} color="var(--accent-text)" />
                        Program Overview
                      </div>
                      <p className={styles.aiOverviewText}>{explainData.overview}</p>
                    </div>
                  </div>

                  {/* AI Educational Disclaimer */}
                  <div className={styles.aiDisclaimerBanner}>
                    <Info size={14} style={{ flexShrink: 0 }} />
                    <span>{explainData.disclaimer}</span>
                  </div>

                  {/* Caveats if incomplete */}
                  {explainData.is_incomplete && (
                    <div className={styles.aiIncompleteBanner}>
                      <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
                      <div>
                        <strong>Incomplete Construct Note:</strong> {explainData.caveats}
                      </div>
                    </div>
                  )}

                  {/* Line by line breakdown */}
                  <div className={styles.explainList}>
                    {explainData.explanations.map((item) => (
                      <div key={item.line_number} className={styles.explainItem}>
                        <div className={styles.lineBadge}>L{item.line_number}</div>
                        <div className={styles.explainBody}>
                          {item.code && (
                            <div className={styles.codeSnippet}>{item.code}</div>
                          )}
                          <p className={styles.explainText}>{item.explanation}</p>
                          {item.concepts && item.concepts.length > 0 && (
                            <div className={styles.conceptsList}>
                              {item.concepts.map((concept, idx) => (
                                <span key={idx} className={styles.conceptTag}>
                                  {concept}
                                </span>
                              ))}
                            </div>
                          )}
                          {item.caveats && (
                            <div className={styles.caveatCallout}>
                              <strong>Note:</strong> {item.caveats}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Overall Caveats Footer */}
                  {explainData.caveats && !explainData.is_incomplete && (
                    <div style={{ marginTop: "0.5rem", padding: "0.75rem", backgroundColor: "var(--surface-1)", borderRadius: "var(--radius-xs)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      <strong style={{ color: "var(--text-primary)" }}>Program-Wide Notes &amp; Caveats:</strong> {explainData.caveats}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 5: DIAGNOSTICS */}
          {activeTab === "diagnostics" && (
            <div>
              {diagnostics.length === 0 ? (
                <p className={styles.emptyState}>
                  No compiler warnings or diagnostics reported.
                </p>
              ) : (
                diagnostics.map((diag) => (
                  <div key={diag.id} className={styles.logEntry}>
                    <span className={styles[`msg_${diag.severity}`]}>
                      [{diag.severity.toUpperCase()}] Line {diag.line}: {diag.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 6: STATUS */}
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
                {status.state === "unconfigured" &&
                  "OneCompiler API Key Not Configured (Set ONECOMPILER_API_KEY in apps/api/.env)"}
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

              <span className={styles.statusLabel}>AI Tutor Provider:</span>
              <span className={styles.statusValue}>
                Google Gemini API ({pseudocodeData?.model || explainData?.model || "gemini-3.5-flash"})
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

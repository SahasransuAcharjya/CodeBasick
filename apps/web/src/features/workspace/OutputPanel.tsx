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
  CheckCircle2,
  Stethoscope,
  RefreshCw,
} from "lucide-react";
import {
  OutputMessage,
  DiagnosticItem,
  ExecutionStatusState,
  PseudocodeApiResponse,
  ExplainApiResponse,
  DiagnoseErrorApiResponse,
} from "./workspace.types";
import { CodeDiffViewer } from "./CodeDiffViewer";
import styles from "./OutputPanel.module.css";

export type OutputPanelTab =
  | "output"
  | "stdin"
  | "pseudocode"
  | "explanation"
  | "diagnostics"
  | "status";

export interface LastExecutionErrorContext {
  rawStderr: string;
  code: string;
  language: string;
  filename: string;
  primaryLine?: number;
}

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

  // Phase 7A: AI Error Doctor & One-Click Fix
  lastExecutionError?: LastExecutionErrorContext | null;
  diagnosisData?: DiagnoseErrorApiResponse | null;
  isDiagnosing?: boolean;
  diagnoseError?: string | null;
  diagnosedCode?: string | null;
  isFixApplied?: boolean;
  activeFileContent?: string;
  onDiagnoseError?: () => void;
  onApplyFix?: () => void;
  onRetryDiagnosis?: () => void;
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
  // Phase 7A
  lastExecutionError,
  diagnosisData,
  isDiagnosing = false,
  diagnoseError,
  diagnosedCode,
  isFixApplied = false,
  activeFileContent = "",
  onDiagnoseError,
  onApplyFix,
  onRetryDiagnosis,
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
                      <div className={styles.sectionHeader}>
                        FORMATTED PSEUDOCODE
                      </div>
                      <pre className={styles.pseudocodeBox}>
                        <code>{pseudocodeData.pseudocode.replace(/\\n/g, "\n")}</code>
                      </pre>
                    </div>

                    <div>
                      <div className={styles.sectionHeader}>
                        LOGICAL STEPS ({pseudocodeData.steps.length})
                      </div>
                      <div className={styles.stepsContainer}>
                        {pseudocodeData.steps.map((step) => (
                          <div key={step.step_number} className={styles.stepCard}>
                            <div className={styles.stepCardHeader}>
                              <div className={styles.stepTitleGroup}>
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
                            <pre className={styles.codeSnippet}>
                              <code>{item.code.replace(/\\n/g, "\n")}</code>
                            </pre>
                          )}
                          <p className={styles.explainText}>{item.explanation}</p>
                          {item.concepts && item.concepts.length > 0 && (
                            <div className={styles.conceptsList} aria-label="Key concepts">
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

          {/* TAB 5: DIAGNOSTICS (PHASE 7A: AI ERROR DOCTOR) */}
          {activeTab === "diagnostics" && (
            <div>
              {/* Special Status: Timeout */}
              {status.state === "timeout" && (
                <div className={styles.aiIncompleteBanner} style={{ marginBottom: "1rem" }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Execution Timed Out (Resource / Time Limit Exceeded)</strong>
                    <p style={{ marginTop: "0.25rem", color: "var(--text-secondary)" }}>
                      The program exceeded the execution time limit. This commonly indicates an infinite loop (e.g. while loop without termination condition) or heavy CPU workload. Automatic code fix is not available for timeouts.
                    </p>
                  </div>
                </div>
              )}

              {/* Special Status: Unconfigured Key */}
              {status.state === "unconfigured" && (
                <div className={styles.aiError} style={{ marginBottom: "1rem" }}>
                  <AlertTriangle size={16} />
                  <div>
                    <strong>OneCompiler API Key Not Configured</strong>
                    <p style={{ marginTop: "0.25rem" }}>
                      Remote execution requires a valid OneCompiler API key. Please configure <code>ONECOMPILER_API_KEY</code> in <code>apps/api/.env</code>.
                    </p>
                  </div>
                </div>
              )}

              {/* Special Status: Provider Network Error */}
              {status.state === "error" && (
                <div className={styles.aiError} style={{ marginBottom: "1rem" }}>
                  <AlertTriangle size={16} />
                  <div>
                    <strong>Execution Provider Connection Error</strong>
                    <p style={{ marginTop: "0.25rem" }}>
                      Could not reach the execution backend. Please verify that the FastAPI backend server is running on port 8000.
                    </p>
                  </div>
                </div>
              )}

              {/* Actionable Error: Compiler or Runtime Error Present */}
              {(status.state === "failed" || Boolean(lastExecutionError?.rawStderr) || diagnostics.some(d => d.severity === "error")) ? (
                <>
                  {/* Section 1: Original Compiler or Runtime Error Output */}
                  <div className={styles.originalErrorContainer}>
                    <div className={styles.sectionHeader}>
                      ACTUAL COMPILER / RUNTIME ERROR OUTPUT
                    </div>
                    <pre className={styles.originalErrorBox}>
                      <code>
                        {lastExecutionError?.rawStderr ||
                          diagnostics.map((d) => `[${d.severity.toUpperCase()}] Line ${d.line || "?"}: ${d.message}`).join("\n")}
                      </code>
                    </pre>
                  </div>

                  {/* Section 2: Structured Diagnostics (if parsed) */}
                  {diagnostics.length > 0 && (
                    <div style={{ marginBottom: "1rem" }}>
                      <div className={styles.sectionHeader}>
                        STRUCTURED DIAGNOSTICS ({diagnostics.length})
                      </div>
                      {diagnostics.map((diag) => (
                        <div key={diag.id} className={styles.logEntry}>
                          <span className={styles[`msg_${diag.severity}`]}>
                            [{diag.severity.toUpperCase()}] {diag.line ? `Line ${diag.line}: ` : ""}{diag.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Section 3: AI Error Doctor Diagnose Action or Diagnosis State */}
                  {!diagnosisData && !isDiagnosing && (
                    <div className={styles.doctorTriggerCard}>
                      <div className={styles.doctorTriggerInfo}>
                        <div className={styles.doctorTriggerTitle}>
                          <Stethoscope size={16} color="var(--accent-text)" />
                          <span>AI Error Doctor</span>
                        </div>
                        <span className={styles.doctorTriggerDesc}>
                          Receive a beginner-friendly diagnosis, explanation, and one-click code fix.
                        </span>
                      </div>
                      <button
                        type="button"
                        className={styles.doctorDiagnoseButton}
                        onClick={onDiagnoseError}
                      >
                        <Sparkles size={14} />
                        <span>Diagnose with AI</span>
                      </button>
                    </div>
                  )}

                  {/* Diagnosing Loading State */}
                  {isDiagnosing && (
                    <div className={styles.aiLoading}>
                      <Sparkles size={24} color="var(--accent-text)" />
                      <div>
                        <strong style={{ color: "var(--text-primary)" }}>
                          AI Error Doctor is Analyzing Your Code...
                        </strong>
                        <p style={{ marginTop: "0.25rem", color: "var(--text-muted)" }}>
                          Gemini AI is examining the compiler error, syntax rules, and intended logic.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Diagnosis Failure State */}
                  {diagnoseError && (
                    <div className={styles.aiError} style={{ marginTop: "0.75rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <AlertTriangle size={16} />
                        <strong>AI Diagnosis Request Failed</strong>
                      </div>
                      <p style={{ fontSize: "0.8125rem", lineHeight: 1.4 }}>{diagnoseError}</p>
                      {onRetryDiagnosis && (
                        <button
                          type="button"
                          className={styles.aiRetryButton}
                          onClick={onRetryDiagnosis}
                        >
                          <RotateCcw size={12} />
                          Retry Diagnosis
                        </button>
                      )}
                    </div>
                  )}

                  {/* Diagnosis Result Card */}
                  {diagnosisData && (
                    <div className={styles.doctorCard}>
                      {/* Doctor Header */}
                      <div className={styles.doctorHeader}>
                        <div className={styles.doctorBadges}>
                          <span className={styles.doctorBadgeType}>
                            {diagnosisData.error_type}
                          </span>
                          {diagnosisData.affected_lines?.length > 0 && (
                            <span className={styles.doctorBadgeLine}>
                              Line {diagnosisData.affected_lines.join(", ")}
                            </span>
                          )}
                          <span className={styles.doctorBadgeConfidence}>
                            {diagnosisData.confidence} Confidence
                          </span>
                        </div>
                        {onRetryDiagnosis && (
                          <button
                            type="button"
                            className={styles.secondaryDoctorButton}
                            onClick={onRetryDiagnosis}
                            title="Regenerate diagnosis"
                          >
                            <RefreshCw size={12} />
                            <span>Re-diagnose</span>
                          </button>
                        )}
                      </div>

                      {/* Summary Section */}
                      <div className={styles.doctorSection}>
                        <span className={styles.doctorSectionHeading}>What Went Wrong</span>
                        <p className={styles.doctorSectionText}>{diagnosisData.summary}</p>
                      </div>

                      {/* Why it Happened */}
                      <div className={styles.doctorSection}>
                        <span className={styles.doctorSectionHeading}>Why It Happened</span>
                        <p className={styles.doctorSectionText}>{diagnosisData.why_it_happened}</p>
                      </div>

                      {/* Suggested Fix */}
                      <div className={styles.doctorSection}>
                        <span className={styles.doctorSectionHeading}>Suggested Correction</span>
                        <p className={styles.doctorSectionText}>{diagnosisData.suggested_fix}</p>
                      </div>

                      {/* Changes Summary List */}
                      {diagnosisData.changes_summary?.length > 0 && (
                        <div className={styles.doctorSection}>
                          <span className={styles.doctorSectionHeading}>Summary of Changes</span>
                          <ul className={styles.doctorChangesList}>
                            {diagnosisData.changes_summary.map((change, idx) => (
                              <li key={idx}>{change}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* AI Disclaimer */}
                      <div className={styles.aiDisclaimerBanner}>
                        <Info size={14} style={{ flexShrink: 0 }} />
                        <span>{diagnosisData.disclaimer}</span>
                      </div>

                      {/* Proposed Code Changes Diff */}
                      {diagnosisData.can_auto_fix && diagnosisData.corrected_code && (
                        <>
                          <CodeDiffViewer
                            originalCode={diagnosedCode || activeFileContent}
                            correctedCode={diagnosisData.corrected_code}
                          />

                          {/* Stale-Fix Protection Notice */}
                          {Boolean(diagnosedCode && activeFileContent !== diagnosedCode) && (
                            <div className={styles.staleWarningBanner}>
                              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                              <span>
                                The editor buffer has been modified since this diagnosis was generated. Review your edits or click &quot;Re-diagnose&quot; before applying.
                              </span>
                            </div>
                          )}

                          {/* Action Controls */}
                          {isFixApplied ? (
                            <div className={styles.appliedSuccessBanner}>
                              <CheckCircle2 size={16} />
                              <span>
                                Correction successfully applied to editor buffer! Press Ctrl+Z in the editor to undo at any time.
                              </span>
                            </div>
                          ) : (
                            <div className={styles.doctorActionRow}>
                              <button
                                type="button"
                                className={styles.applyFixButton}
                                onClick={onApplyFix}
                                disabled={Boolean(diagnosedCode && activeFileContent !== diagnosedCode)}
                                title={
                                  Boolean(diagnosedCode && activeFileContent !== diagnosedCode)
                                    ? "Re-diagnose required: editor buffer has changed"
                                    : "Apply suggested correction to active file buffer"
                                }
                              >
                                <Check size={14} />
                                <span>Apply Fix to Editor</span>
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Empty state when no error or successful run */
                <p className={styles.emptyState}>
                  No compiler warnings or execution errors reported. Click &quot;Run&quot; above to execute code. If an error occurs, CodeBasick AI Error Doctor will provide a step-by-step diagnosis and one-click fix.
                </p>
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
                Google Gemini API ({pseudocodeData?.model || explainData?.model || "gemini-3.5-flash-lite"})
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

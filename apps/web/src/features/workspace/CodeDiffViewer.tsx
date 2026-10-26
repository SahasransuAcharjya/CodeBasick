"use client";

import React, { useMemo } from "react";
import styles from "./CodeDiffViewer.module.css";

interface CodeDiffViewerProps {
  originalCode: string;
  correctedCode: string;
  language?: string;
}

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

/**
 * Computes a standard Longest Common Subsequence (LCS) line diff.
 */
function computeLineDiff(original: string, modified: string): DiffLine[] {
  const origLines = original.split("\n");
  const modLines = modified.split("\n");

  const m = origLines.length;
  const n = modLines.length;

  // Build DP table for LCS
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origLines[i - 1] === modLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff
  const diff: DiffLine[] = [];
  let i = m;
  let j = n;

  const stack: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origLines[i - 1] === modLines[j - 1]) {
      stack.push({
        type: "unchanged",
        oldLineNumber: i,
        newLineNumber: j,
        content: origLines[i - 1],
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({
        type: "added",
        newLineNumber: j,
        content: modLines[j - 1],
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      stack.push({
        type: "removed",
        oldLineNumber: i,
        content: origLines[i - 1],
      });
      i--;
    }
  }

  while (stack.length > 0) {
    diff.push(stack.pop()!);
  }

  return diff;
}

export function CodeDiffViewer({
  originalCode,
  correctedCode,
}: CodeDiffViewerProps) {
  const diffLines = useMemo(
    () => computeLineDiff(originalCode, correctedCode),
    [originalCode, correctedCode]
  );

  const stats = useMemo(() => {
    let additions = 0;
    let deletions = 0;
    for (const line of diffLines) {
      if (line.type === "added") additions++;
      if (line.type === "removed") deletions++;
    }
    return { additions, deletions };
  }, [diffLines]);

  return (
    <div className={styles.diffContainer} aria-label="Code changes diff viewer">
      <div className={styles.diffHeader}>
        <span className={styles.diffTitle}>Proposed Code Changes</span>
        <div className={styles.diffStats}>
          <span className={styles.statAdd}>+{stats.additions} lines</span>
          <span className={styles.statDel}>-{stats.deletions} lines</span>
        </div>
      </div>

      <div className={styles.diffContent}>
        <table className={styles.diffTable}>
          <tbody>
            {diffLines.map((line, idx) => {
              const rowClass =
                line.type === "added"
                  ? styles.rowAdded
                  : line.type === "removed"
                  ? styles.rowRemoved
                  : styles.rowUnchanged;

              const prefix =
                line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";

              return (
                <tr key={idx} className={rowClass}>
                  <td className={styles.lineNo}>
                    {line.oldLineNumber != null ? line.oldLineNumber : ""}
                  </td>
                  <td className={styles.lineNo}>
                    {line.newLineNumber != null ? line.newLineNumber : ""}
                  </td>
                  <td className={styles.marker} aria-hidden="true">
                    {prefix}
                  </td>
                  <td className={styles.codeCell}>
                    <code>{line.content || " "}</code>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

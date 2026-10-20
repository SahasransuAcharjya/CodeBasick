"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, Terminal, Code2, ShieldCheck, Cpu } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from "@/components/ui";

export default function DocsPage() {
  return (
    <AppShell>
      <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.625rem", fontWeight: 700, color: "var(--text-primary)" }}>
            CodeBasick Documentation &amp; Architecture
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Overview of the beginner-friendly programming IDE foundation and architecture.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Code2 size={18} color="var(--accent-text)" />
              Supported Languages &amp; Environments
            </CardTitle>
          </CardHeader>
          <CardContent style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
              <div>
                <strong style={{ color: "var(--text-primary)" }}>Python 3</strong>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Targeting Python 3.13 standard libraries and algorithms</p>
              </div>
              <Badge variant="teal">Planned Phase 5</Badge>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
              <div>
                <strong style={{ color: "var(--text-primary)" }}>JavaScript</strong>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Node.js execution environment for web &amp; scripts</p>
              </div>
              <Badge variant="teal">Planned Phase 5</Badge>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0" }}>
              <div>
                <strong style={{ color: "var(--text-primary)" }}>HTML &amp; CSS</strong>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Live client rendering for beginner web programming</p>
              </div>
              <Badge variant="teal">Planned Phase 5</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ShieldCheck size={18} color="var(--accent-text)" />
              Security &amp; Sandboxing Principles
            </CardTitle>
          </CardHeader>
          <CardContent style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            <p>
              CodeBasick strictly isolates untrusted user code execution from the core API server. User-submitted code will run inside isolated execution containers (Judge0 engine) with tight CPU, memory, and timeout constraints.
            </p>
            <p style={{ marginTop: "0.75rem" }}>
              The API never executes student code with in-process <code>eval()</code> or <code>exec()</code>, ensuring complete host system integrity.
            </p>
          </CardContent>
        </Card>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Link href="/">
            <Button variant="secondary">Back to Workspaces</Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

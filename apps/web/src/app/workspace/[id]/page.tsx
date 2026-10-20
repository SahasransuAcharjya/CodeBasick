"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Plus } from "lucide-react";
import { WorkspaceShell } from "@/features/workspace";
import { Button } from "@/components/ui/Button";
import { getWorkspaceById, createWorkspace } from "@/lib/storage";
import { Workspace } from "@/types";

function WorkspaceViewInner() {
  const params = useParams();
  const router = useRouter();
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

  const handleCreateNew = () => {
    const created = createWorkspace({
      name: "Scratchpad Workspace",
      language: "python",
      description: "Quick coding scratchpad.",
    });
    router.push(`/workspace/${created.id}`);
  };

  if (isLoading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--bg-canvas)",
          color: "var(--text-muted)",
          fontSize: "0.875rem",
        }}
      >
        Loading CodeBasick Workspace...
      </div>
    );
  }

  if (!workspace) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--bg-canvas)",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--surface-1)",
            border: "1px solid var(--border-default)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--status-warning)",
            marginBottom: "1rem",
          }}
        >
          <AlertCircle size={24} />
        </div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
          Workspace Not Found
        </h1>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
            maxWidth: "400px",
            margin: "0.5rem 0 1.5rem",
            lineHeight: 1.5,
          }}
        >
          The requested workspace does not exist in local storage or has been removed.
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/">
            <Button variant="secondary" leftIcon={<ArrowLeft size={14} />}>
              Back to Workspaces
            </Button>
          </Link>
          <Button variant="primary" leftIcon={<Plus size={14} />} onClick={handleCreateNew}>
            Create New Workspace
          </Button>
        </div>
      </div>
    );
  }

  return <WorkspaceShell initialWorkspace={workspace} />;
}

export default function WorkspacePage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--bg-canvas)",
            color: "var(--text-muted)",
          }}
        >
          Loading CodeBasick Workspace...
        </div>
      }
    >
      <WorkspaceViewInner />
    </Suspense>
  );
}

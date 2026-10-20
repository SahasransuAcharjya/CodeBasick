"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getWorkspaces, createWorkspace } from "@/lib/storage";

export default function WorkspaceIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const list = getWorkspaces();
    if (list.length > 0) {
      router.replace(`/workspace/${list[0].id}`);
    } else {
      const created = createWorkspace({
        name: "Default Workspace",
        language: "python",
        description: "Initial coding workspace.",
      });
      router.replace(`/workspace/${created.id}`);
    }
  }, [router]);

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
      Opening CodeBasick Workspace...
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchProjects, createProject } from "@/lib/projectApi";

export default function WorkspaceIndexPage() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    async function initWorkspace() {
      const res = await fetchProjects();
      if (!isMounted) return;
      if (res.items.length > 0) {
        router.replace(`/workspace/${res.items[0].id}`);
      } else {
        const created = await createProject({
          name: "Default Workspace",
          language: "python",
          description: "Initial coding workspace.",
        });
        if (isMounted) {
          router.replace(`/workspace/${created.id}`);
        }
      }
    }
    initWorkspace();
    return () => {
      isMounted = false;
    };
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

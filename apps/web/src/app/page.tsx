"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Code2,
  Trash2,
  ArrowRight,
  Sparkles,
  Terminal,
  Cpu,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Button,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  EmptyState,
  Modal,
} from "@/components/ui";
import {
  getWorkspaces,
  createWorkspace,
  deleteWorkspace,
} from "@/lib/storage";
import { Workspace, ProgrammingLanguage } from "@/types";
import styles from "./page.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [language, setLanguage] = useState<ProgrammingLanguage>("python");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setWorkspaces(getWorkspaces());
    setIsLoaded(true);
  }, []);

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Workspace name is required.");
      return;
    }

    const created = createWorkspace({
      name: name.trim(),
      language,
      description: description.trim(),
    });

    setWorkspaces(getWorkspaces());
    setIsModalOpen(false);
    setName("");
    setDescription("");
    setFormError("");

    // Navigate to the newly created workspace
    router.push(`/workspace/${created.id}`);
  };

  const handleDelete = (id: string, workspaceName: string) => {
    if (window.confirm(`Are you sure you want to delete "${workspaceName}"?`)) {
      deleteWorkspace(id);
      setWorkspaces(getWorkspaces());
    }
  };

  const getLanguageLabel = (lang: ProgrammingLanguage) => {
    switch (lang) {
      case "c":
        return "C (GCC)";
      case "python":
        return "Python 3";
      case "javascript":
        return "JavaScript (Node)";
      case "html-css":
        return "HTML / CSS";
      default:
        return lang;
    }
  };

  return (
    <AppShell onNewWorkspaceClick={() => setIsModalOpen(true)}>
      <div className={styles.dashboard}>
        {/* Workspace Purpose Hero */}
        <div className={styles.hero}>
          <div className={styles.heroHeader}>
            <div>
              <h1 className={styles.heading}>Workspaces</h1>
              <p className={styles.subheading}>
                Write, test, and understand your code in focused programming environments
                designed specifically for beginner programmers.
              </p>
            </div>
            <Button
              variant="primary"
              leftIcon={<Plus size={16} />}
              onClick={() => setIsModalOpen(true)}
            >
              Create Workspace
            </Button>
          </div>
        </div>

        {/* Workspaces Section */}
        <section aria-labelledby="workspaces-heading">
          <div className={styles.sectionHeader}>
            <h2 id="workspaces-heading" className={styles.sectionTitle}>
              Your Workspaces
              {isLoaded && (
                <span className={styles.workspaceCount}>
                  ({workspaces.length})
                </span>
              )}
            </h2>
          </div>

          {/* Truthful Empty State */}
          {isLoaded && workspaces.length === 0 ? (
            <EmptyState
              icon={<Code2 size={24} />}
              title="No workspaces created yet"
              description="Create your first coding workspace to start writing Python, JavaScript, or Web code with structured AI assistance."
              action={
                <Button
                  variant="primary"
                  leftIcon={<Plus size={16} />}
                  onClick={() => setIsModalOpen(true)}
                >
                  Create Your First Workspace
                </Button>
              }
            />
          ) : (
            <div className={styles.grid}>
              {workspaces.map((ws) => (
                <Card key={ws.id}>
                  <CardHeader>
                    <div style={{ flex: 1 }}>
                      <CardTitle>{ws.name}</CardTitle>
                      <CardDescription>
                        Created {new Date(ws.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className={styles.cardHeaderRight}>
                      <Badge variant="teal">
                        {getLanguageLabel(ws.language)}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className={styles.cardDesc}>
                      {ws.description || "General coding practice workspace."}
                    </p>
                  </CardContent>

                  <CardFooter>
                    <span>{ws.fileCount} starter file</span>
                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        onClick={() => handleDelete(ws.id, ws.name)}
                        style={{
                          color: "var(--text-muted)",
                          padding: "0.3rem",
                          borderRadius: "var(--radius-xs)",
                        }}
                        aria-label={`Delete workspace ${ws.name}`}
                        title="Delete workspace"
                      >
                        <Trash2 size={14} />
                      </button>
                      <Link href={`/workspace/${ws.id}`}>
                        <Button
                          variant="secondary"
                          size="sm"
                          rightIcon={<ArrowRight size={14} />}
                        >
                          Open
                        </Button>
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Honest Future Architecture Roadmap Callout */}
        <section className={styles.roadmapSection} aria-labelledby="roadmap-heading">
          <h2 id="roadmap-heading" className={styles.sectionTitle}>
            Architectural Roadmap
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            CodeBasick is modularly built across distinct phases. Below are the planned next steps:
          </p>

          <div className={styles.roadmapGrid}>
            <div className={styles.roadmapCard}>
              <span className={styles.roadmapTitle}>
                <Code2 size={16} color="var(--accent-text)" />
                Phase 4: Interactive Monaco Workspace
              </span>
              <p className={styles.roadmapDesc}>
                In-browser multi-file code editing, Monaco Editor integration, C and Python support, and developer workspace layout.
              </p>
              <span className={styles.roadmapStatus} style={{ color: "var(--accent-primary)", borderColor: "var(--accent-border)" }}>Active &amp; Ready</span>
            </div>

            <div className={styles.roadmapCard}>
              <span className={styles.roadmapTitle}>
                <Cpu size={16} color="var(--accent-text)" />
                Phase 5: Code Execution Sandbox
              </span>
              <p className={styles.roadmapDesc}>
                Isolated execution sandbox running C and Python via OneCompiler API with live output and diagnostics.
              </p>
              <span className={styles.roadmapStatus} style={{ color: "var(--accent-primary)", borderColor: "var(--accent-border)" }}>Active &amp; Ready</span>
            </div>

            <div className={styles.roadmapCard}>
              <span className={styles.roadmapTitle}>
                <Sparkles size={16} color="var(--accent-text)" />
                Phase 6: AI-Powered Tutor
              </span>
              <p className={styles.roadmapDesc}>
                Context-aware code explanations, syntax error guidance, and beginner coding hints.
              </p>
              <span className={styles.roadmapStatus}>Planned</span>
            </div>
          </div>
        </section>
      </div>

      {/* Create Workspace Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormError("");
        }}
        title="Create New Workspace"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setIsModalOpen(false);
                setFormError("");
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateWorkspace}>
              Create &amp; Open
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateWorkspace} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Input
            label="Workspace Name"
            placeholder="e.g. Python Variables Practice"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (formError) setFormError("");
            }}
            errorMessage={formError}
            required
            autoFocus
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label
              htmlFor="ws-language"
              style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-primary)" }}
            >
              Primary Language
            </label>
            <select
              id="ws-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as ProgrammingLanguage)}
              style={{
                width: "100%",
                backgroundColor: "var(--surface-1)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                padding: "0.5rem 0.75rem",
                fontSize: "0.875rem",
              }}
            >
              <option value="python">Python 3</option>
              <option value="c">C (GCC C11)</option>
              <option value="javascript">JavaScript (Node.js)</option>
              <option value="html-css">HTML &amp; CSS</option>
            </select>
          </div>

          <Textarea
            label="Description (Optional)"
            placeholder="What will you learn or build in this workspace?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </form>
      </Modal>
    </AppShell>
  );
}

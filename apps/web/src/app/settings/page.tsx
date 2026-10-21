"use client";

import React, { useState, useEffect } from "react";
import { Check, Code } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge } from "@/components/ui";
import { getPreferences, savePreferences } from "@/lib/storage";
import { WorkspacePreferences } from "@/types";

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<WorkspacePreferences>({
    fontSize: 14,
    tabSize: 4,
    wordWrap: true,
    theme: "dark-charcoal",
  });
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setPrefs(getPreferences());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    savePreferences(prefs);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <AppShell>
      <div style={{ maxWidth: "700px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.625rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Settings &amp; Preferences
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Configure your local editor behavior, theme, and code preferences.
          </p>
        </div>

        <form onSubmit={handleSave}>
          <Card>
            <CardHeader>
              <div>
                <CardTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Code size={18} color="var(--accent-text)" />
                  Editor Configuration
                </CardTitle>
                <CardDescription>
                  These preferences will automatically apply to your coding sessions.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Font Size */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label
                  htmlFor="font-size-select"
                  style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-primary)" }}
                >
                  Editor Font Size
                </label>
                <select
                  id="font-size-select"
                  value={prefs.fontSize}
                  onChange={(e) => setPrefs({ ...prefs, fontSize: Number(e.target.value) })}
                  style={{
                    backgroundColor: "var(--surface-2)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-primary)",
                    padding: "0.5rem 0.75rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value={12}>12 px — Compact</option>
                  <option value={14}>14 px — Standard</option>
                  <option value={16}>16 px — Large</option>
                  <option value={18}>18 px — Extra Large</option>
                </select>
              </div>

              {/* Tab Size */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label
                  htmlFor="tab-size-select"
                  style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-primary)" }}
                >
                  Tab Indentation Size
                </label>
                <select
                  id="tab-size-select"
                  value={prefs.tabSize}
                  onChange={(e) => setPrefs({ ...prefs, tabSize: Number(e.target.value) })}
                  style={{
                    backgroundColor: "var(--surface-2)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-primary)",
                    padding: "0.5rem 0.75rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value={2}>2 Spaces</option>
                  <option value={4}>4 Spaces (Standard Python/General)</option>
                </select>
              </div>

              {/* Theme Notice */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-primary)" }}>
                  Color Theme
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Badge variant="teal" withDot>
                    Dark Charcoal (Default)
                  </Badge>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Optimized for reduced eye strain
                  </span>
                </div>
              </div>
            </CardContent>

            <CardFooter style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                {savedNotice && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8125rem", color: "var(--accent-text)" }}>
                    <Check size={14} />
                    Preferences saved locally
                  </span>
                )}
              </div>
              <Button type="submit" variant="primary">
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppShell>
  );
}

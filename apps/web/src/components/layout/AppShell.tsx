"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import styles from "./AppShell.module.css";

interface AppShellProps {
  children: React.ReactNode;
  onNewWorkspaceClick?: () => void;
}

function AppShellInner({ children, onNewWorkspaceClick }: AppShellProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen]);

  const navItems = [
    {
      label: "Workspaces",
      href: "/",
      icon: LayoutDashboard,
      isActive: pathname === "/" || pathname.startsWith("/workspace/"),
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      isActive: pathname === "/settings",
    },
    {
      label: "Docs & Guides",
      href: "/docs",
      icon: BookOpen,
      isActive: pathname === "/docs",
    },
  ];

  // Derive current page title for breadcrumb
  let currentTitle = "Workspaces";
  if (pathname.startsWith("/workspace/")) {
    currentTitle = "Workspace Editor (Preview)";
  } else if (pathname === "/settings") {
    currentTitle = "Settings";
  } else if (pathname === "/docs") {
    currentTitle = "Documentation";
  }

  return (
    <div className={styles.shell}>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className={styles.mobileBackdrop}
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ""} ${
          isMobileOpen ? styles.sidebarMobileOpen : ""
        }`}
        aria-label="Application navigation"
      >
        <div className={styles.sidebarBrand}>
          <Link href="/" className={styles.brandLink}>
            <div className={styles.brandIcon} aria-hidden="true">
              CB
            </div>
            {!isCollapsed && (
              <div>
                <span className={styles.brandText}>CodeBasick</span>
                <span className={styles.brandPhase}>v0.1</span>
              </div>
            )}
          </Link>

          <button
            type="button"
            className={styles.collapseButton}
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${item.isActive ? styles.navItemActive : ""}`}
                title={isCollapsed ? item.label : undefined}
                aria-current={item.isActive ? "page" : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.systemStatus}>
            <span className={styles.statusDot} aria-hidden="true" />
            {!isCollapsed && <span>API Ready &bull; Local Engine</span>}
          </div>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div
        className={`${styles.mainWrapper} ${
          isCollapsed ? styles.mainWrapperCollapsed : ""
        }`}
      >
        {/* Sticky Top Navigation Bar */}
        <header className={styles.topNav}>
          <div className={styles.topNavLeft}>
            <button
              type="button"
              className={styles.mobileMenuToggle}
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>

            <div className={styles.topNavBreadcrumb}>
              <span>CodeBasick</span>
              <span aria-hidden="true">/</span>
              <span className={styles.breadcrumbCurrent}>{currentTitle}</span>
            </div>
          </div>

          <div className={styles.topNavRight}>
            <Badge variant="teal" withDot>
              Phase 3 Foundation
            </Badge>

            {onNewWorkspaceClick && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={onNewWorkspaceClick}
              >
                New Workspace
              </Button>
            )}
          </div>
        </header>

        {/* Primary Page Content */}
        <main className={styles.contentArea}>{children}</main>
      </div>
    </div>
  );
}

export function AppShell(props: AppShellProps) {
  return (
    <Suspense
      fallback={
        <div className={styles.shell}>
          <main className={styles.contentArea}>{props.children}</main>
        </div>
      }
    >
      <AppShellInner {...props} />
    </Suspense>
  );
}

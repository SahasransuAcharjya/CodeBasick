import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "2rem",
        backgroundColor: "var(--bg-canvas)",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "var(--radius-md)",
          backgroundColor: "var(--surface-1)",
          border: "1px solid var(--border-default)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--status-warning)",
          marginBottom: "1.25rem",
        }}
      >
        <AlertCircle size={28} />
      </div>

      <h1
        style={{
          fontSize: "1.75rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "0.5rem",
        }}
      >
        Page Not Found
      </h1>

      <p
        style={{
          fontSize: "0.9375rem",
          color: "var(--text-secondary)",
          maxWidth: "420px",
          lineHeight: 1.5,
          marginBottom: "1.75rem",
        }}
      >
        The page you requested could not be found or has moved. Return to your workspaces to continue coding.
      </p>

      <Link href="/">
        <Button variant="primary" leftIcon={<ArrowLeft size={16} />}>
          Return to Workspaces
        </Button>
      </Link>
    </div>
  );
}

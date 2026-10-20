import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export function Header() {
  return (
    <header style={{ borderBottom: "1px solid #27272a", padding: "1rem 2rem", background: "#09090b" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "1200px", margin: "0 auto" }}>
        <div>
          <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fafafa", letterSpacing: "-0.025em" }}>
            {APP_NAME}
          </span>
          <span style={{ marginLeft: "0.75rem", fontSize: "0.875rem", color: "#a1a1aa" }}>
            Phase 1 Foundation
          </span>
        </div>
        <p style={{ margin: 0, fontSize: "0.8125rem", color: "#71717a" }}>
          {APP_TAGLINE}
        </p>
      </div>
    </header>
  );
}

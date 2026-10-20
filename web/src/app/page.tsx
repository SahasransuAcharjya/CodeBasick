import { Header } from "@/components/Header";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.badge}>
          <span className={styles.statusDot} />
          Phase 1: Workspace &amp; Architecture Initialized
        </div>

        <h1 className={styles.title}>
          Welcome to <span className={styles.titleGradient}>CodeBasick</span>
        </h1>

        <p className={styles.description}>
          An AI-powered, beginner-friendly online programming IDE built with a modern
          Next.js App Router frontend and high-performance Python FastAPI backend.
        </p>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Frontend (Next.js)</h2>
            <p className={styles.cardDesc}>
              Next.js 16 App Router with strict TypeScript checking, modular folder hierarchy,
              and native component separation.
            </p>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Backend (FastAPI)</h2>
            <p className={styles.cardDesc}>
              Python FastAPI service featuring modern pyproject.toml configuration,
              health probe endpoint, and clean route decoupling.
            </p>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Modular Architecture</h2>
            <p className={styles.cardDesc}>
              Separation of concerns between web client, api microservice, shared
              documentation, and environment configurations.
            </p>
          </div>
        </div>
      </main>
      <footer className={styles.footer}>
        CodeBasick Workspace Foundation &bull; Ready for Phase 2 Implementation
      </footer>
    </>
  );
}

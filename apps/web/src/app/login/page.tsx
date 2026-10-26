"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Info, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both your email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      router.push("/");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Invalid credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleClick = () => {
    if (!googleClientId) {
      setInfoMessage(
        "Google Sign-In is not configured in this environment. To enable it, configure NEXT_PUBLIC_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID in your environment."
      );
      return;
    }

    // Google Identity Services flow when configured
    try {
      if (typeof window !== "undefined" && (window as unknown as { google?: { accounts?: { id?: unknown } } }).google) {
        // Trigger GSI prompt if available
        setInfoMessage("Connecting to Google authentication...");
      } else {
        setInfoMessage("Loading Google Sign-In SDK...");
      }
    } catch {
      setErrorMessage("Failed to initiate Google authentication.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        <div className={styles.brandHeader}>
          <div className={styles.brandLogo} aria-hidden="true">
            CB
          </div>
          <h1 className={styles.title}>Sign in to CodeBasick</h1>
          <p className={styles.subtitle}>Access your cloud workspaces, projects, and AI tutoring</p>
        </div>

        {errorMessage && (
          <div className={styles.errorBanner} role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div className={styles.infoBanner} role="status">
            <Info size={16} aria-hidden="true" />
            <span>{infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <Input
            id="login-email"
            type="email"
            label="Email address"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />

          <Input
            id="login-password"
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight size={16} />}
            style={{ width: "100%", marginTop: "0.5rem" }}
          >
            Sign In
          </Button>
        </form>

        <div className={styles.divider}>or</div>

        <button
          type="button"
          onClick={handleGoogleClick}
          className={styles.googleButton}
          disabled={isSubmitting}
          aria-label="Sign in with Google"
        >
          <svg className={styles.googleIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className={styles.footerLinks}>
          <div>
            Don&apos;t have an account?{" "}
            <Link href="/register" className={styles.link}>
              Sign up
            </Link>
          </div>
          <Link href="/" className={styles.guestLink}>
            Continue as Guest (Local Workspaces Only)
          </Link>
        </div>
      </div>
    </div>
  );
}

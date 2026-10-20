import React from "react";
import styles from "./Badge.module.css";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "teal" | "neutral" | "warning" | "error" | "info";
  withDot?: boolean;
}

export function Badge({
  children,
  variant = "neutral",
  withDot = false,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`${styles.badge} ${styles[variant]} ${className || ""}`}
      {...props}
    >
      {withDot && <span className={styles.dot} aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
}

import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
}

export function Skeleton({
  width = "100%",
  height = "20px",
  borderRadius = "var(--radius-md)",
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: "var(--surface-2)",
        opacity: 0.7,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

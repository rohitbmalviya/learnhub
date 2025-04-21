"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0–100
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeClasses = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-2.5",
};

export function ProgressBar({
  value,
  className,
  trackClassName,
  fillClassName,
  showLabel = false,
  size = "md",
  label,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const isComplete = clamped === 100;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Course progress"}
        className={cn(
          "flex-1 rounded-full bg-muted overflow-hidden",
          sizeClasses[size],
          trackClassName
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            isComplete ? "bg-green-500" : "bg-primary",
            fillClassName
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span
          className={cn(
            "text-xs font-semibold tabular-nums shrink-0",
            isComplete ? "text-green-600" : "text-primary"
          )}
        >
          {clamped}%
        </span>
      )}
    </div>
  );
}

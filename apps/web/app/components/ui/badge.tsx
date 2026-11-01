import { clsx } from "clsx";
import type { ReactNode } from "react";

type Props = {
  variant?: "count" | "status";
  children: ReactNode;
};

export function Badge({ variant = "status", children }: Props) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 text-caption",
        variant === "count"
          ? "bg-brand text-on-brand"
          : "bg-surface-2 text-muted",
      )}
    >
      {children}
    </span>
  );
}

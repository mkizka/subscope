import type { ComponentChildren } from "preact";

import { cn } from "../utils/cn";

type BadgeVariant = "default" | "secondary";

type BadgeProps = {
  children: ComponentChildren;
  className?: string;
  variant?: BadgeVariant;
};

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-primary-container text-on-primary-container",
  secondary: "bg-secondary-container text-on-secondary-container",
};

export function Badge({
  children,
  className,
  variant = "default",
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-small px-2.5 py-1 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

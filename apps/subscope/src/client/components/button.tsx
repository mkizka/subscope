import type { ComponentChildren } from "preact";

import { cn } from "../utils/cn";

type ButtonVariant = "default" | "outline" | "ghost";

type ButtonProps = {
  children: ComponentChildren;
  className?: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
};

const variantStyles: Record<ButtonVariant, string> = {
  default:
    "bg-primary text-on-primary shadow-elevation-1 hover:shadow-elevation-2",
  outline:
    "border-2 border-outline bg-transparent text-primary hover:bg-primary-container",
  ghost: "bg-transparent text-primary hover:bg-primary-container",
};

export function Button({
  children,
  className,
  variant = "default",
  disabled,
  onClick,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium",
        "transition-all duration-200 ease-out",
        "hover:scale-[1.02] active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant],
        className,
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

type ButtonLinkProps = {
  children: ComponentChildren;
  className?: string;
  variant?: ButtonVariant;
  href: string;
};

export function ButtonLink({
  children,
  className,
  variant = "default",
  href,
}: ButtonLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium",
        "transition-all duration-200 ease-out",
        "hover:scale-[1.02] active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </a>
  );
}

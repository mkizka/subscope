import { clsx } from "clsx";
import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";

const VARIANTS = {
  primary: "bg-brand font-bold text-on-brand hover:opacity-90",
  secondary: "border border-line bg-surface text-ink hover:bg-surface-2",
  ghost: "aspect-square text-muted hover:bg-surface-2",
  danger: "bg-danger text-on-brand hover:opacity-90",
};

type Options = {
  variant?: keyof typeof VARIANTS;
  size?: "md" | "sm";
};

export const buttonClass = ({
  variant = "primary",
  size = "md",
}: Options = {}) =>
  clsx(
    `
      inline-flex shrink-0 items-center justify-center gap-2 rounded-full
      text-label
      disabled:cursor-not-allowed disabled:opacity-50
    `,
    VARIANTS[variant],
    size === "md" ? "h-10" : "h-8",
    variant !== "ghost" && "px-4",
  );

type Props = Omit<ComponentProps<"button">, "className"> &
  Options & { loading?: boolean };

export function Button({
  variant,
  size,
  loading,
  disabled,
  children,
  ...props
}: Props) {
  return (
    <button
      className={buttonClass({ variant, size })}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

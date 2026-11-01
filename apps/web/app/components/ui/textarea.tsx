import { clsx } from "clsx";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<"textarea">, "className"> & {
  label?: string;
  error?: string;
};

export function Textarea({ label, error, ...props }: Props) {
  return (
    <label className="flex flex-col gap-1">
      {label && <span className="text-label">{label}</span>}
      <textarea
        className={clsx(
          "rounded-xl border bg-surface p-3 text-body",
          error ? "border-danger" : "border-line",
        )}
        aria-invalid={!!error}
        {...props}
      />
      {error && <span className="text-label text-danger">{error}</span>}
    </label>
  );
}

import { clsx } from "clsx";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<"input">, "className"> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, ...props }: Props) {
  return (
    <label className="flex flex-col gap-1">
      {label && <span className="text-label">{label}</span>}
      <input
        className={clsx(
          "h-10 rounded-full border bg-surface px-4 text-body",
          error ? "border-danger" : "border-line",
        )}
        aria-invalid={!!error}
        {...props}
      />
      {error && (
        <span role="alert" className="text-label text-danger">
          {error}
        </span>
      )}
    </label>
  );
}

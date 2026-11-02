import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

type Props = { label: string; children?: ReactNode };

export function LoadingSpinner({ label, children }: Props) {
  return (
    <div role="status" aria-label={label} className="flex justify-center py-6">
      <LoaderCircle className="size-6 animate-spin text-muted" />
      {children}
    </div>
  );
}

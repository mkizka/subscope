import { LoaderCircleIcon } from "lucide-react";

export function HydrateFallbackElement() {
  return (
    <div className="flex size-full items-center justify-center">
      <LoaderCircleIcon className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}

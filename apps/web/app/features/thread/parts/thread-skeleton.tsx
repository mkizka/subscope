import { Skeleton } from "@/app/components/ui/skeleton";

export function ThreadSkeleton() {
  return (
    <div
      role="status"
      aria-label="読み込み中"
      className="border-b border-line px-4 pt-3 pb-2"
    >
      <div className="flex items-center gap-3">
        <span className="size-10 shrink-0 rounded-full bg-surface-2" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

import { Skeleton } from "./ui/skeleton";

const rowIds = ["a", "b", "c", "d", "e"];

export function RowsSkeleton() {
  return (
    <div role="status" aria-label="読み込み中">
      {rowIds.map((id) => (
        <div
          key={id}
          className="flex items-center gap-3 border-b border-line px-4 py-3"
        >
          <span className="size-10 shrink-0 rounded-full bg-surface-2" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

import { Skeleton } from "./ui/skeleton";

const rowIds = ["a", "b", "c", "d", "e", "f"];

function Rows({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-label="読み込み中">
      {rowIds.map((id) => (
        <div key={id} className="flex gap-3 border-b border-line px-4 py-3">
          {children}
        </div>
      ))}
    </div>
  );
}

export function AccountsSkeleton() {
  return (
    <Rows>
      <Skeleton className="size-10 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="mt-1 h-5 w-14" />
      </div>
    </Rows>
  );
}

export function NotificationsSkeleton() {
  return (
    <Rows>
      <div className="flex w-10 shrink-0 justify-end pt-2">
        <Skeleton className="size-6" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="size-8" />
        <Skeleton className="mt-1 h-3.5 w-11/12" />
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </Rows>
  );
}

export function ListsSkeleton() {
  return (
    <Rows>
      <Skeleton className="size-10 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </Rows>
  );
}

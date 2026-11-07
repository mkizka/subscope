import { PostsSkeleton } from "@/app/components/posts-skeleton";
import { Skeleton } from "@/app/components/ui/skeleton";

export function ThreadSkeleton() {
  return (
    <>
      <div className="border-b border-line px-4 pt-3 pb-2">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0" />
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
        <Skeleton className="mt-3 h-3 w-1/3" />
      </div>
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <Skeleton className="size-8 shrink-0" />
        <Skeleton className="h-3.5 w-1/3" />
      </div>
      <PostsSkeleton count={2} />
    </>
  );
}

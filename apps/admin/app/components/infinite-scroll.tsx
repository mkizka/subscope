import { useEffect, useRef } from "react";

import { cn } from "~/utils/cn";

interface InfiniteScrollProps {
  onIntersect: () => void;
  hasMore: boolean;
  isLoading: boolean;
  className?: string;
}

export function InfiniteScroll({
  onIntersect,
  hasMore,
  isLoading,
  className,
}: InfiniteScrollProps) {
  const triggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          onIntersect();
        }
      },
      { threshold: 0.1 },
    );

    if (triggerRef.current) {
      observer.observe(triggerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [onIntersect, hasMore, isLoading]);

  if (!hasMore) return null;

  return (
    <div ref={triggerRef} className={cn("flex justify-center", className)}>
      {isLoading && (
        <span className="loading loading-spinner loading-xl"></span>
      )}
    </div>
  );
}

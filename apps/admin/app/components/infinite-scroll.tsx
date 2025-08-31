import { useEffect, useRef } from "react";

interface InfiniteScrollProps {
  onIntersect: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export function InfiniteScroll({
  onIntersect,
  hasMore,
  isLoading,
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
    <div ref={triggerRef} className="flex justify-center py-4">
      {isLoading && (
        <span className="loading loading-spinner loading-md"></span>
      )}
    </div>
  );
}

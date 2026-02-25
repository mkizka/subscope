import { useCallback, useEffect, useRef } from "react";

type Props = {
  onIntersect: () => void;
  enabled?: boolean;
};

export function InfiniteScrollTrigger({ onIntersect, enabled = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && enabled) {
        onIntersect();
      }
    },
    [onIntersect, enabled],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect);
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  return <div ref={ref} />;
}

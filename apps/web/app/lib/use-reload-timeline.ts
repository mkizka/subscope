import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router";

const timelineKeys: Record<string, string> = {
  "/": "timeline",
  "/?tab=local": "local-timeline",
};

export function useReloadTimeline() {
  const queryClient = useQueryClient();
  const { pathname, search } = useLocation();
  return (to: string) => {
    const key = timelineKeys[to];
    if (!key || to !== pathname + search) return;
    window.scrollTo({ top: 0 });
    void queryClient.refetchQueries({ queryKey: [key], type: "active" });
  };
}

import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router";

export function useReloadTimeline() {
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  return () => {
    if (pathname !== "/") return;
    window.scrollTo({ top: 0 });
    for (const key of ["timeline", "local-timeline"]) {
      void queryClient.refetchQueries({ queryKey: [key], type: "active" });
    }
  };
}

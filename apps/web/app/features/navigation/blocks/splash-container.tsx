import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { Splash } from "@/app/features/navigation/parts/splash";

import { meQueryOptions } from "./side-nav-container";

const FADE_MS = 300;

export function SplashContainer() {
  const { isPending } = useQuery(meQueryOptions);
  const [phase, setPhase] = useState<"shown" | "leaving" | "gone">(
    isPending ? "shown" : "gone",
  );

  useEffect(() => {
    if (isPending) return;
    setPhase((current) => {
      if (current !== "shown") return current;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
      return reduced.matches ? "gone" : "leaving";
    });
  }, [isPending]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = setTimeout(() => setPhase("gone"), FADE_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  return phase === "gone" ? null : <Splash leaving={phase === "leaving"} />;
}

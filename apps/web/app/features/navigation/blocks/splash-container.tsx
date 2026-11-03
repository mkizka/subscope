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
    if (isPending || phase !== "shown") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("gone");
      return;
    }
    setPhase("leaving");
    const timer = setTimeout(() => setPhase("gone"), FADE_MS);
    return () => clearTimeout(timer);
  }, [isPending, phase]);

  return phase === "gone" ? null : <Splash leaving={phase === "leaving"} />;
}

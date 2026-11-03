import { useQuery } from "@tanstack/react-query";

import { Splash } from "@/app/features/navigation/parts/splash";

import { meQueryOptions } from "./side-nav-container";

export function SplashContainer() {
  const { isPending } = useQuery(meQueryOptions);
  return isPending ? <Splash /> : null;
}

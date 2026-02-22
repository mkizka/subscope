import { MeSubscoSyncGetSubscriptionStatus } from "@repo/client/api";
import { data } from "react-router";

import { HydrateFallbackElement } from "@/app/components/hydrate-fallback";
import { expressContext } from "@/app/context/express";
import { HomePage } from "@/app/features/home/pages/home";
import { TimelinePage } from "@/app/features/timeline/pages/timeline";

import type { Route } from "./+types/_index";

export function meta() {
  return [
    { title: "Subscope - 省ストレージなBluesky互換Appview" },
    {
      name: "description",
      content: "Tapを利用して省ストレージを目指したBluesky互換のAppview",
    },
  ];
}

export const loader = async ({ context }: Route.LoaderArgs) => {
  const server = context.get(expressContext);
  if (!server.agent) {
    return data({ isSubscriber: false });
  }
  const response = await server.agent.me.subsco.sync.getSubscriptionStatus();
  const isSubscriber = MeSubscoSyncGetSubscriptionStatus.isSubscribed(
    response.data,
  );
  return data({ isSubscriber });
};

export function HydrateFallback() {
  return <HydrateFallbackElement />;
}

export default function Home({ loaderData }: Route.ComponentProps) {
  if (loaderData.isSubscriber) {
    return <TimelinePage />;
  }
  return <HomePage />;
}

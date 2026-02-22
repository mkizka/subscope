import { MeSubscoSyncGetSubscriptionStatus } from "@repo/client/api";
import { data } from "react-router";

import { HomePage } from "@/app/features/home/pages/home";
import { TimelinePage } from "@/app/features/timeline/pages/timeline";
import { getAgent } from "@/app/lib/oauth/session.server";

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

// TODO: エラーハンドリング追加
export const loader = async ({ request }: Route.LoaderArgs) => {
  const agent = await getAgent(request);
  if (!agent) {
    return data({ isSubscriber: false });
  }
  const response = await agent.me.subsco.sync.getSubscriptionStatus();
  const isSubscriber = MeSubscoSyncGetSubscriptionStatus.isSubscribed(
    response.data,
  );
  return data({ isSubscriber });
};

export default function Home({ loaderData }: Route.ComponentProps) {
  if (loaderData.isSubscriber) {
    return <TimelinePage />;
  }
  return <HomePage />;
}

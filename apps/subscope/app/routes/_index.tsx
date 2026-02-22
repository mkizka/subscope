import { MeSubscoSyncGetSubscriptionStatus } from "@repo/client/api";
import { data } from "react-router";

import { expressContext } from "@/app/context/express";
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

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const { injected } = context.get(expressContext);
  const logger = injected.loggerManager.createLogger("_index");

  const agent = await getAgent(request);
  if (!agent) {
    return data({ isSubscriber: false });
  }

  let response;
  try {
    response = await agent.me.subsco.sync.getSubscriptionStatus();
  } catch (e) {
    logger.error(e, "Failed to get subscription status");
    throw data("アカウント登録状態の取得に失敗しました", { status: 500 });
  }

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

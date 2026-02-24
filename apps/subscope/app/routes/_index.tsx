import {
  AtpBaseClient,
  MeSubscoSyncGetSubscriptionStatus,
} from "@repo/client/api";
import { data } from "react-router";

import { expressContext } from "@/app/context/express";
import { HomePage } from "@/app/features/home/pages/home";
import { TimelinePage } from "@/app/features/timeline/pages/timeline";
import { getAgent } from "@/app/lib/oauth/session.server";
import { env } from "@/server/shared/env";

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

  const client = new AtpBaseClient({ service: env.PUBLIC_URL });
  let setupStatus;
  try {
    const response = await client.me.subsco.server.getSetupStatus();
    setupStatus = response.data;
  } catch (e) {
    logger.error(e, "Failed to get setup status");
    throw data("セットアップ状態の取得に失敗しました", { status: 500 });
  }

  if (!setupStatus.initialized) {
    return data({ state: "setup" as const });
  }

  const agent = await getAgent(request);
  if (!agent) {
    return data({ state: "home" as const });
  }

  let subscriptionResponse;
  try {
    subscriptionResponse = await agent.me.subsco.sync.getSubscriptionStatus();
  } catch (e) {
    logger.error(e, "Failed to get subscription status");
    throw data("アカウント登録状態の取得に失敗しました", { status: 500 });
  }

  const isSubscriber = MeSubscoSyncGetSubscriptionStatus.isSubscribed(
    subscriptionResponse.data,
  );
  if (!isSubscriber) {
    return data({ state: "home" as const });
  }
  return data({
    state: "timeline" as const,
    atprotoProxy: `${env.SERVICE_DID}#bsky_appview`,
  });
};

export default function Home({ loaderData }: Route.ComponentProps) {
  if (loaderData.state === "setup") {
    return <HomePage variant="setup" />;
  }
  if (loaderData.state === "timeline") {
    return <TimelinePage atprotoProxy={loaderData.atprotoProxy} />;
  }
  return <HomePage variant="home" />;
}

import { Client } from "@atproto/lex";
import { currentDatetimeString } from "@atproto/syntax";
import { view as imagesView } from "@repo/client/lex/app/bsky/embed/images";
import type { FeedViewPost } from "@repo/client/lex/app/bsky/feed/defs";
import getTimeline from "@repo/client/lex/app/bsky/feed/getTimeline";
import post from "@repo/client/lex/app/bsky/feed/post";
import getSetupStatus from "@repo/client/lex/me/subsco/server/getSetupStatus";
import getSubscriptionStatus, {
  subscribed,
} from "@repo/client/lex/me/subsco/sync/getSubscriptionStatus";
import { data, redirect } from "react-router";

import { HomePage } from "@/app/features/home/pages/home";
import {
  countGraphemes,
  MAX_IMAGES,
  MAX_POST_LENGTH,
} from "@/app/features/timeline/blocks/post-form";
import type { TimelinePost } from "@/app/features/timeline/blocks/timeline-feed";
import { TimelinePage } from "@/app/features/timeline/pages/timeline";
import { loggerManager } from "@/app/lib/logger.server";
import { getAgent } from "@/app/lib/oauth/session.server";
import { env } from "@/app/shared/env";

import type { Route } from "./+types/_index";

export function meta() {
  return [
    { title: "Subscope - 省ストレージなBluesky互換AppView" },
    {
      name: "description",
      content: "Tapを利用して省ストレージを目指したBluesky互換のAppView",
    },
  ];
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const logger = loggerManager.createLogger("_index");

  const client = new Client(env.APPVIEW_URL);
  let setupStatus;
  try {
    setupStatus = await client.call(getSetupStatus);
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
    subscriptionResponse = await agent.call(getSubscriptionStatus);
  } catch (e) {
    logger.error(e, "Failed to get subscription status");
    throw data("アカウント登録状態の取得に失敗しました", { status: 500 });
  }

  if (!subscribed.isTypeOf(subscriptionResponse)) {
    return data({ state: "home" as const });
  }
  const timeline = await agent.call(getTimeline, { limit: 20 });
  return data({
    state: "timeline" as const,
    atprotoProxy: `${env.APPVIEW_DID}#bsky_appview`,
    posts: timeline.feed.map(toTimelinePost).reverse(),
  });
};

export const action = async ({ request }: Route.ActionArgs) => {
  const agent = await getAgent(request);
  if (!agent) {
    throw redirect("/login");
  }
  const formData = await request.formData();
  const text = formData.get("text");
  const files = formData.getAll("image").filter((f) => f instanceof File);
  const alts = formData.getAll("alt");
  if (
    typeof text !== "string" ||
    (text.trim() === "" && files.length === 0) ||
    countGraphemes(text) > MAX_POST_LENGTH ||
    files.length > MAX_IMAGES
  ) {
    return data({ error: "投稿内容が不正です" }, { status: 400 });
  }
  try {
    const images = await Promise.all(
      files.map(async (file, i) => {
        const { body } = await agent.uploadBlob(file);
        return { image: body.blob, alt: maybeString(alts[i]) ?? "" };
      }),
    );
    const { uri } = await agent.create(post, {
      text,
      embed:
        images.length > 0
          ? { $type: "app.bsky.embed.images", images }
          : undefined,
      createdAt: currentDatetimeString(),
    });
    return data({ uri });
  } catch (e) {
    loggerManager.createLogger("_index").error(e, "Failed to create post");
    return data({ error: "投稿に失敗しました" }, { status: 500 });
  }
};

const maybeString = (value: unknown) =>
  typeof value === "string" ? value : undefined;

function toTimelinePost({ post, reason }: FeedViewPost): TimelinePost {
  return {
    uri: post.uri,
    authorAvatar: post.author.avatar,
    authorDisplayName: post.author.displayName,
    authorHandle: post.author.handle,
    text: maybeString(post.record.text),
    replyCount: post.replyCount,
    repostCount: post.repostCount,
    likeCount: post.likeCount,
    images: imagesView.matches(post.embed) ? post.embed.images : undefined,
    createdAt: maybeString(post.record.createdAt),
    reasonRepost:
      reason && "by" in reason
        ? { byDisplayName: reason.by.displayName, byHandle: reason.by.handle }
        : undefined,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  if (loaderData.state === "setup") {
    return <HomePage variant="setup" />;
  }
  if (loaderData.state === "timeline") {
    return (
      <TimelinePage
        atprotoProxy={loaderData.atprotoProxy}
        posts={loaderData.posts}
      />
    );
  }
  return <HomePage variant="home" />;
}

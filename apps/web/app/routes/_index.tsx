import { setTimeout } from "node:timers/promises";

import { TID } from "@atproto/common-web";
import { asAtUriString, currentDatetimeString } from "@atproto/syntax";
import { view as imagesView } from "@repo/client/lex/app/bsky/embed/images";
import type { FeedViewPost } from "@repo/client/lex/app/bsky/feed/defs";
import getPosts from "@repo/client/lex/app/bsky/feed/getPosts";
import getTimeline from "@repo/client/lex/app/bsky/feed/getTimeline";
import postRecord from "@repo/client/lex/app/bsky/feed/post";
import threadgate from "@repo/client/lex/app/bsky/feed/threadgate";
import getSubscriptionStatus, {
  subscribed,
} from "@repo/client/lex/me/subsco/sync/getSubscriptionStatus";
import { data, redirect } from "react-router";

import {
  countGraphemes,
  isReplyRule,
  MAX_IMAGES,
  MAX_POST_LENGTH,
  type ReplyRule,
} from "@/app/features/timeline/blocks/post-form";
import type { TimelinePost } from "@/app/features/timeline/blocks/timeline-feed";
import { loggerManager } from "@/app/lib/logger.server";
import { getAgent } from "@/app/lib/oauth/session.server";
import { TimelinePage } from "@/app/pages/client/timeline-page";

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
  const agent = await getAgent(request);
  if (!agent) {
    throw redirect("/login");
  }

  let subscriptionResponse;
  try {
    subscriptionResponse = await agent.call(getSubscriptionStatus);
  } catch (e) {
    loggerManager
      .createLogger("_index")
      .error(e, "Failed to get subscription status");
    throw data("アカウント登録状態の取得に失敗しました", { status: 500 });
  }

  if (!subscribed.isTypeOf(subscriptionResponse)) {
    throw redirect("/login");
  }
  const cursor = new URL(request.url).searchParams.get("cursor") ?? undefined;
  const timeline = await agent.call(getTimeline, { limit: 20, cursor });
  return data({
    posts: timeline.feed
      .filter(({ post, reason }) => reason || !post.record.reply)
      .map(toTimelinePost)
      .reverse(),
    cursor: timeline.cursor,
  });
};

const THREADGATE_RULES = {
  follower: { $type: "app.bsky.feed.threadgate#followerRule" },
  following: { $type: "app.bsky.feed.threadgate#followingRule" },
  mention: { $type: "app.bsky.feed.threadgate#mentionRule" },
} as const satisfies Record<ReplyRule, unknown>;

export const action = async ({ request }: Route.ActionArgs) => {
  const agent = await getAgent(request);
  if (!agent) {
    throw redirect("/login");
  }
  const formData = await request.formData();
  const text = formData.get("text");
  const files = formData.getAll("image").filter((f) => f instanceof File);
  const alts = formData.getAll("alt");
  const ref = (
    uri: FormDataEntryValue | null,
    cid: FormDataEntryValue | null,
  ) =>
    typeof uri === "string" && uri && typeof cid === "string" && cid
      ? { uri: asAtUriString(uri), cid }
      : undefined;
  const subject = ref(formData.get("uri"), formData.get("cid"));
  const root = ref(formData.get("rootUri"), formData.get("rootCid")) ?? subject;
  const quote = formData.get("type") === "quote" ? subject : undefined;
  const allow = formData.get("allow");
  const rules =
    typeof allow === "string" ? allow.split(",").filter(Boolean) : [];
  if (
    typeof text !== "string" ||
    (text.trim() === "" && files.length === 0) ||
    countGraphemes(text) > MAX_POST_LENGTH ||
    files.length > MAX_IMAGES ||
    !rules.every(isReplyRule)
  ) {
    return data({ error: "投稿内容が不正です" }, { status: 400 });
  }
  const rkey = TID.nextStr();
  const uri = `at://${agent.assertDid}/app.bsky.feed.post/${rkey}` as const;
  const createdAt = currentDatetimeString();
  try {
    const images = await Promise.all(
      files.map(async (file, i) => {
        const { body } = await agent.uploadBlob(file);
        return { image: body.blob, alt: maybeString(alts[i]) ?? "" };
      }),
    );
    const media =
      images.length > 0
        ? { $type: "app.bsky.embed.images" as const, images }
        : undefined;
    await agent.applyWrites((op) => [
      op.create(
        postRecord,
        {
          text,
          embed:
            quote && media
              ? {
                  $type: "app.bsky.embed.recordWithMedia",
                  record: { record: quote },
                  media,
                }
              : quote
                ? { $type: "app.bsky.embed.record", record: quote }
                : media,
          reply:
            formData.get("type") === "reply" && subject && root
              ? { root, parent: subject }
              : undefined,
          createdAt,
        },
        { rkey },
      ),
      ...(typeof allow === "string"
        ? [
            op.create(
              threadgate,
              {
                post: uri,
                allow: rules.map((rule) => THREADGATE_RULES[rule]),
                createdAt,
              },
              { rkey },
            ),
          ]
        : []),
    ]);
    for (let i = 0; i < 20; i++) {
      const { posts } = await agent
        .call(getPosts, { uris: [uri] })
        .catch(() => ({ posts: [] }));
      if (posts.length > 0) break;
      await setTimeout(250);
    }
    return data({ uri });
  } catch (e) {
    loggerManager.createLogger("_index").error(e, "Failed to create post");
    return data({ error: "投稿に失敗しました" }, { status: 500 });
  }
};

const maybeString = (value: unknown) =>
  typeof value === "string" ? value : undefined;

export function toTimelinePost({ post, reason }: FeedViewPost): TimelinePost {
  return {
    uri: post.uri,
    cid: post.cid,
    viewerLike: post.viewer?.like,
    viewerRepost: post.viewer?.repost,
    replyRoot: postRecord.matches(post.record)
      ? post.record.reply?.root
      : undefined,
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
  return <TimelinePage posts={loaderData.posts} cursor={loaderData.cursor} />;
}

import { view as imagesView } from "@repo/client/lex/app/bsky/embed/images";
import type { FeedViewPost } from "@repo/client/lex/app/bsky/feed/defs";
import getTimeline from "@repo/client/lex/app/bsky/feed/getTimeline";
import postRecord from "@repo/client/lex/app/bsky/feed/post";
import getSubscriptionStatus, {
  subscribed,
} from "@repo/client/lex/me/subsco/sync/getSubscriptionStatus";

import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";

export type TimelinePostDto = {
  uri: string;
  cid: string;
  viewerLike?: string;
  viewerRepost?: string;
  replyRoot?: { uri: string; cid: string };
  authorAvatar?: string;
  authorDisplayName?: string;
  authorHandle: string;
  text?: string;
  replyCount?: number;
  repostCount?: number;
  likeCount?: number;
  createdAt?: string;
  images?: { thumb: string; alt: string }[];
  reasonRepost?: { byDisplayName?: string; byHandle: string };
};

export interface ITimelineQuery {
  isSubscribed: (did: string) => Promise<boolean>;
  findPosts: (
    did: string,
    cursor?: string,
  ) => Promise<{ posts: TimelinePostDto[]; cursor?: string }>;
}

export const timelineQueryFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): ITimelineQuery => {
  const restore = async (did: string) => {
    const agent = await oauthClient.restore(did);
    if (!agent) throw new Error("OAuth session not found");
    return agent;
  };
  return {
    async isSubscribed(did) {
      const agent = await restore(did);
      return subscribed.isTypeOf(await agent.call(getSubscriptionStatus));
    },
    async findPosts(did, cursor) {
      const agent = await restore(did);
      const { feed, cursor: next } = await agent.call(getTimeline, {
        limit: 20,
        cursor,
      });
      return { posts: feed.map(toTimelinePost), cursor: next };
    },
  };
};

const maybeString = (value: unknown) =>
  typeof value === "string" ? value : undefined;

export function toTimelinePost({
  post,
  reason,
}: FeedViewPost): TimelinePostDto {
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

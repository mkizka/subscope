import { view as externalView } from "@repo/client/lex/app/bsky/embed/external";
import { view as imagesView } from "@repo/client/lex/app/bsky/embed/images";
import {
  view as recordView,
  viewRecord,
} from "@repo/client/lex/app/bsky/embed/record";
import { view as recordWithMediaView } from "@repo/client/lex/app/bsky/embed/recordWithMedia";
import type { FeedViewPost } from "@repo/client/lex/app/bsky/feed/defs";
import getTimeline from "@repo/client/lex/app/bsky/feed/getTimeline";
import postRecord from "@repo/client/lex/app/bsky/feed/post";
import searchPosts from "@repo/client/lex/app/bsky/feed/searchPosts";
import { link } from "@repo/client/lex/app/bsky/richtext/facet";
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
  links?: { byteStart: number; byteEnd: number; uri: string }[];
  replyCount?: number;
  repostCount?: number;
  likeCount?: number;
  createdAt?: string;
  images?: { thumb: string; fullsize: string; alt: string }[];
  external?: {
    uri: string;
    title: string;
    description: string;
    thumb?: string;
  };
  quote?: { authorDisplayName?: string; authorHandle: string; text?: string };
  reasonRepost?: { byDisplayName?: string; byHandle: string };
};

export interface ITimelineQuery {
  isSubscribed: (did: string) => Promise<boolean>;
  findPosts: (
    did: string,
    cursor?: string,
  ) => Promise<{ posts: TimelinePostDto[]; cursor?: string }>;
  searchPosts: (did: string, q: string) => Promise<TimelinePostDto[]>;
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
    async searchPosts(did, q) {
      const agent = await restore(did);
      const { posts } = await agent.call(searchPosts, { q });
      return posts.map((post) => toTimelinePost({ post }));
    },
  };
};

const maybeString = (value: unknown) =>
  typeof value === "string" ? value : undefined;

export function toTimelinePost({
  post,
  reason,
}: FeedViewPost): TimelinePostDto {
  const media = recordWithMediaView.matches(post.embed)
    ? post.embed.media
    : post.embed;
  const quoted = recordWithMediaView.matches(post.embed)
    ? post.embed.record.record
    : recordView.matches(post.embed)
      ? post.embed.record
      : undefined;
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
    links: postRecord.matches(post.record)
      ? post.record.facets?.flatMap(({ index, features }) =>
          features
            .filter((feature) => link.matches(feature))
            .map(({ uri }) => ({
              byteStart: index.byteStart,
              byteEnd: index.byteEnd,
              uri,
            })),
        )
      : undefined,
    replyCount: post.replyCount,
    repostCount: post.repostCount,
    likeCount: post.likeCount,
    images: imagesView.matches(media) ? media.images : undefined,
    external: externalView.matches(media) ? media.external : undefined,
    quote: viewRecord.matches(quoted)
      ? {
          authorDisplayName: quoted.author.displayName,
          authorHandle: quoted.author.handle,
          text: maybeString(quoted.value.text),
        }
      : undefined,
    createdAt: maybeString(post.record.createdAt),
    reasonRepost:
      reason && "by" in reason
        ? { byDisplayName: reason.by.displayName, byHandle: reason.by.handle }
        : undefined,
  };
}

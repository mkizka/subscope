import { view as externalView } from "@repo/client/app/bsky/embed/external";
import {
  view as galleryView,
  viewImage as galleryViewImage,
} from "@repo/client/app/bsky/embed/gallery";
import { view as imagesView } from "@repo/client/app/bsky/embed/images";
import {
  view as recordView,
  viewBlocked,
  viewDetached,
  viewNotFound,
  viewRecord,
} from "@repo/client/app/bsky/embed/record";
import { view as recordWithMediaView } from "@repo/client/app/bsky/embed/recordWithMedia";
import { view as videoView } from "@repo/client/app/bsky/embed/video";
import {
  type FeedViewPost,
  generatorView,
} from "@repo/client/app/bsky/feed/defs";
import getTimeline from "@repo/client/app/bsky/feed/getTimeline";
import postRecord from "@repo/client/app/bsky/feed/post";
import searchPosts from "@repo/client/app/bsky/feed/searchPosts";
import { link, mention } from "@repo/client/app/bsky/richtext/facet";
import getRegistrationStatus, {
  registered,
} from "@repo/client/me/subsco/sync/getRegistrationStatus";

import type {
  TextLinkDto,
  TimelinePostDto,
} from "@/app/server/application/dto/timeline-post-dto";
import type { IOAuthClient } from "@/app/server/application/interfaces/oauth-client";
import type { ITimelineQuery } from "@/app/server/application/interfaces/timeline-query";

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
    async isRegistered(did) {
      const agent = await restore(did);
      return registered.isTypeOf(await agent.call(getRegistrationStatus));
    },
    async findPosts(did, cursor) {
      const agent = await restore(did);
      const { feed, cursor: next } = await agent.call(getTimeline, {
        limit: 50,
        cursor,
      });
      return {
        posts: feed.filter(isShownInFeed).map(toTimelinePost),
        cursor: next,
      };
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

function toLinks(record: unknown): TextLinkDto[] | undefined {
  if (!postRecord.matches(record)) return undefined;
  return record.facets?.flatMap(({ index: { byteStart, byteEnd }, features }) =>
    features.flatMap((feature): TextLinkDto[] =>
      link.matches(feature)
        ? [{ byteStart, byteEnd, uri: feature.uri }]
        : mention.matches(feature)
          ? [{ byteStart, byteEnd, did: feature.did }]
          : [],
    ),
  );
}

export function isShownInFeed({ post, reason }: FeedViewPost) {
  if (reason || !postRecord.matches(post.record) || !post.record.reply) {
    return true;
  }
  const { root, parent } = post.record.reply;
  return [root, parent].every((ref) =>
    ref.uri.startsWith(`at://${post.author.did}/`),
  );
}

function mediaOf(embed: unknown) {
  return recordWithMediaView.matches(embed) ? embed.media : embed;
}

function toVideo(media: unknown) {
  return videoView.matches(media) ? media : undefined;
}

function toImages(media: unknown) {
  return imagesView.matches(media)
    ? media.images
    : galleryView.matches(media)
      ? media.items
          .filter((item) => galleryViewImage.matches(item))
          .map(({ thumbnail, fullsize, alt, aspectRatio }) => ({
            thumb: thumbnail,
            fullsize,
            alt,
            aspectRatio,
          }))
      : undefined;
}

export function toTimelinePost({
  post,
  reason,
}: FeedViewPost): TimelinePostDto {
  const media = mediaOf(post.embed);
  const quoted = recordWithMediaView.matches(post.embed)
    ? post.embed.record.record
    : recordView.matches(post.embed)
      ? post.embed.record
      : undefined;
  const quotedMedia = viewRecord.matches(quoted)
    ? mediaOf(quoted.embeds?.[0])
    : undefined;
  return {
    uri: post.uri,
    cid: post.cid,
    viewerLike: post.viewer?.like,
    viewerRepost: post.viewer?.repost,
    replyRoot: postRecord.matches(post.record)
      ? post.record.reply?.root
      : undefined,
    replyParentUri: postRecord.matches(post.record)
      ? post.record.reply?.parent.uri
      : undefined,
    authorAvatar: post.author.avatar,
    authorDisplayName: post.author.displayName,
    authorHandle: post.author.handle,
    text: maybeString(post.record.text),
    links: toLinks(post.record),
    replyCount: post.replyCount,
    repostCount: post.repostCount,
    likeCount: post.likeCount,
    images: toImages(media),
    video: toVideo(media),
    external: externalView.matches(media) ? media.external : undefined,
    quote: viewRecord.matches(quoted)
      ? {
          authorAvatar: quoted.author.avatar,
          authorDisplayName: quoted.author.displayName,
          authorHandle: quoted.author.handle,
          text: maybeString(quoted.value.text),
          links: toLinks(quoted.value),
          images: toImages(quotedMedia),
          video: toVideo(quotedMedia),
          external: externalView.matches(quotedMedia)
            ? quotedMedia.external
            : undefined,
          threadPath: `/${quoted.author.handle}/post/${quoted.uri.split("/").pop()}`,
        }
      : undefined,
    quoteUnavailable: viewNotFound.matches(quoted)
      ? "notFound"
      : viewBlocked.matches(quoted)
        ? "blocked"
        : viewDetached.matches(quoted)
          ? "detached"
          : undefined,
    quotedFeed: generatorView.matches(quoted)
      ? {
          avatar: quoted.avatar,
          displayName: quoted.displayName,
          creatorHandle: quoted.creator.handle,
          description: quoted.description,
        }
      : undefined,
    createdAt: maybeString(post.record.createdAt),
    reasonRepost:
      reason && "by" in reason
        ? { byDisplayName: reason.by.displayName, byHandle: reason.by.handle }
        : undefined,
  };
}

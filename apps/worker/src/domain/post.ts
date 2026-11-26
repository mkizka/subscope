import type { Did } from "@atproto/did";
import { type BlobRef, getBlobCidString } from "@atproto/lex";
import { AtUri } from "@atproto/syntax";
import external from "@repo/client/app/bsky/embed/external";
import gallery, { image } from "@repo/client/app/bsky/embed/gallery";
import images from "@repo/client/app/bsky/embed/images";
import embedRecord from "@repo/client/app/bsky/embed/record";
import recordWithMedia from "@repo/client/app/bsky/embed/recordWithMedia";
import video from "@repo/client/app/bsky/embed/video";
import { validateRecord } from "@repo/common/utils";

import type { FeedItem } from "./feed-item.js";
import type { Notification } from "./notification.js";
import type { Record } from "./record.js";
import { getSortAt } from "./sort-at.js";

const validatePost = (record: Record) =>
  validateRecord("app.bsky.feed.post", record);

type RawEmbed = NonNullable<ReturnType<typeof validatePost>["embed"]>;

type StrongRef = Readonly<{ uri: AtUri; cid: string }>;

export type EmbedImage = {
  cid: string;
  alt: string;
  aspectRatio?: { width: number; height: number };
};

export type EmbedMedia =
  | { type: "images" | "gallery"; images: EmbedImage[] }
  | {
      type: "video";
      cid: string;
      alt: string | null;
      aspectRatio: EmbedImage["aspectRatio"] | null;
      presentation: string | null;
    }
  | {
      type: "external";
      uri: string;
      title: string;
      description: string;
      thumbCid: string | null;
    };

export type PostEmbed =
  | EmbedMedia
  | { type: "record"; uri: AtUri; cid: string }
  | { type: "recordWithMedia"; uri: AtUri; cid: string; media: EmbedMedia };

const toStrongRef = (ref?: { uri: string; cid: string }) =>
  ref ? { uri: new AtUri(ref.uri), cid: ref.cid } : null;

const toEmbedImages = (
  items: {
    image: BlobRef;
    alt: string;
    aspectRatio?: EmbedImage["aspectRatio"];
  }[],
): EmbedImage[] =>
  items.map((item) => ({
    cid: getBlobCidString(item.image),
    alt: item.alt,
    aspectRatio: item.aspectRatio,
  }));

const toEmbedMedia = (embed: RawEmbed): EmbedMedia | null => {
  if (images.isTypeOf(embed)) {
    return { type: "images", images: toEmbedImages(embed.images) };
  }
  if (gallery.isTypeOf(embed)) {
    return {
      type: "gallery",
      images: toEmbedImages(embed.items.filter((item) => image.isTypeOf(item))),
    };
  }
  if (video.isTypeOf(embed)) {
    return {
      type: "video",
      cid: getBlobCidString(embed.video),
      alt: embed.alt ?? null,
      aspectRatio: embed.aspectRatio ?? null,
      presentation: embed.presentation ?? null,
    };
  }
  if (external.isTypeOf(embed)) {
    return {
      type: "external",
      uri: embed.external.uri,
      title: embed.external.title,
      description: embed.external.description,
      thumbCid: getBlobCidString(embed.external.thumb) ?? null,
    };
  }
  return null;
};

const toEmbed = (embed: RawEmbed): PostEmbed | null => {
  if (embedRecord.isTypeOf(embed)) {
    return {
      type: "record",
      uri: new AtUri(embed.record.uri),
      cid: embed.record.cid,
    };
  }
  if (recordWithMedia.isTypeOf(embed)) {
    const { uri, cid } = embed.record.record;
    const media = toEmbedMedia(embed.media);
    // サポートしていないメディアの場合は画像や動画を埋め込んでいない引用投稿として扱う
    return media
      ? { type: "recordWithMedia", uri: new AtUri(uri), cid, media }
      : { type: "record", uri: new AtUri(uri), cid };
  }
  return toEmbedMedia(embed);
};

export class Post {
  static readonly replyNotificationDepth = 4;

  private embeddingRulesViolated = false;
  private threadgateViolated = false;

  private constructor(
    readonly uri: AtUri,
    readonly cid: string,
    readonly accountDid: Did,
    readonly text: string,
    readonly replyRoot: StrongRef | null,
    readonly replyParent: StrongRef | null,
    readonly langs: string[],
    readonly embed: PostEmbed | null,
    readonly mentionDids: Did[],
    readonly createdAt: Date,
    readonly indexedAt: Date,
  ) {}

  static fromRecord(record: Record) {
    const parsed = validatePost(record);
    return new Post(
      new AtUri(record.uri.toString()),
      record.cid,
      record.uri.did,
      parsed.text,
      toStrongRef(parsed.reply?.root),
      toStrongRef(parsed.reply?.parent),
      parsed.langs ?? [],
      parsed.embed ? toEmbed(parsed.embed) : null,
      (parsed.facets ?? [])
        .flatMap((facet) => facet.features)
        .flatMap((feature) => ("did" in feature ? [feature.did] : [])),
      new Date(parsed.createdAt),
      record.indexedAt,
    );
  }

  get violatesEmbeddingRules() {
    return this.embeddingRulesViolated;
  }

  markEmbeddingRulesViolated() {
    this.embeddingRulesViolated = true;
  }

  get violatesThreadgate() {
    return this.threadgateViolated;
  }

  markThreadgateViolated() {
    this.threadgateViolated = true;
  }

  get feedItem(): FeedItem {
    return {
      uri: this.uri.toString(),
      cid: this.cid,
      type: "post",
      subjectUri: null,
      accountDid: this.accountDid,
      sortAt: getSortAt(this),
    };
  }

  private get quotedUri() {
    const { embed } = this;
    return embed?.type === "record" || embed?.type === "recordWithMedia"
      ? embed.uri
      : null;
  }

  get fetchableEmbedUri() {
    const uri = this.quotedUri;
    return uri &&
      ["app.bsky.feed.post", "app.bsky.feed.generator"].includes(uri.collection)
      ? uri
      : null;
  }

  get quotedPostUri() {
    const uri = this.quotedUri;
    return uri?.collection === "app.bsky.feed.post" ? uri : null;
  }

  get statsTargets() {
    const { replyParent, quotedUri } = this;
    return [
      ...(replyParent ? [replyParent.uri] : []),
      ...(quotedUri ? [quotedUri] : []),
    ];
  }

  notifications(replyAncestorUris: AtUri[]): Notification[] {
    const quoteUri = this.violatesEmbeddingRules ? null : this.quotedPostUri;
    const base = {
      recordUri: this.uri.toString(),
      authorDid: this.accountDid,
      sortAt: getSortAt(this),
    };
    return [
      ...this.mentionDids.map((did) => ({
        ...base,
        recipientDid: did,
        reason: "mention" as const,
        reasonSubject: null,
      })),
      ...(quoteUri
        ? [
            {
              ...base,
              recipientDid: quoteUri.hostname,
              reason: "quote" as const,
              reasonSubject: quoteUri.toString(),
            },
          ]
        : []),
      ...replyAncestorUris.map((uri) => ({
        ...base,
        recipientDid: uri.hostname,
        reason: "reply" as const,
        reasonSubject: uri.toString(),
      })),
    ];
  }
}

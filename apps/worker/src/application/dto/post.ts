import { asDid, type Did } from "@atproto/did";
import { type BlobRef, getBlobCidString } from "@atproto/lex";
import { AtUri } from "@atproto/syntax";
import external from "@repo/client/app/bsky/embed/external";
import gallery, { image } from "@repo/client/app/bsky/embed/gallery";
import images from "@repo/client/app/bsky/embed/images";
import embedRecord from "@repo/client/app/bsky/embed/record";
import recordWithMedia from "@repo/client/app/bsky/embed/recordWithMedia";
import { validateRecord } from "@repo/common/utils";

import type { Record } from "./record.js";

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

export type Post = {
  uri: AtUri;
  cid: string;
  accountDid: Did;
  text: string;
  replyRoot: StrongRef | null;
  replyParent: StrongRef | null;
  langs: string[] | null;
  embed: PostEmbed | null;
  createdAt: Date;
  indexedAt: Date;
};

/**
 * embedのURIがインデックス可能なコレクションの場合そのURIを返す。
 * アプリケーション層でPostのインデックス時にこのURIのレコードもインデックスする。
 */
export function getEmbedRecordUri(post: Post): AtUri | null {
  const { embed } = post;
  if (
    (embed?.type === "record" || embed?.type === "recordWithMedia") &&
    ["app.bsky.feed.post", "app.bsky.feed.generator"].includes(
      embed.uri.collection,
    )
  ) {
    return embed.uri;
  }
  return null;
}

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

// TODO: app.bsky.embed.videoをサポートする
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

export function parsePost(record: Record): Post {
  const parsed = validatePost(record);
  return {
    uri: new AtUri(record.uri.toString()),
    cid: record.cid,
    accountDid: asDid(record.uri.host),
    text: parsed.text,
    replyRoot: toStrongRef(parsed.reply?.root),
    replyParent: toStrongRef(parsed.reply?.parent),
    langs: parsed.langs ?? [],
    embed: parsed.embed ? toEmbed(parsed.embed) : null,
    createdAt: new Date(parsed.createdAt),
    indexedAt: record.indexedAt,
  };
}

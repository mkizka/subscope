import { asDid, type Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";

import type { Record } from "../record/record.js";
import { PostEmbedExternal } from "./embed-external.js";
import { PostEmbedImage } from "./embed-images.js";
import { PostEmbedRecord } from "./embed-record.js";
import { PostEmbedRecordWithMedia } from "./embed-record-with-media.js";

type StrongRef = Readonly<{
  uri: AtUri;
  cid: string;
}>;

const getStrongRef = (ref: { uri: string; cid: string } | undefined) => {
  return (
    ref && {
      uri: new AtUri(ref.uri),
      cid: ref.cid,
    }
  );
};

export type PostParams = {
  uri: AtUri | string;
  cid: string;
  actorDid: string;
  text: string;
  replyRoot?: StrongRef | null;
  replyParent?: StrongRef | null;
  langs: string[] | null;
  embed:
    | PostEmbedExternal
    | PostEmbedImage[]
    | PostEmbedRecord
    | PostEmbedRecordWithMedia
    | null;
  createdAt: Date;
  indexedAt: Date;
};

export class Post {
  readonly uri: AtUri;
  readonly cid: string;
  readonly actorDid: Did;
  readonly text: string;
  readonly replyRoot: StrongRef | null;
  readonly replyParent: StrongRef | null;
  readonly langs: string[] | null;
  readonly embed:
    | PostEmbedExternal
    | PostEmbedImage[]
    | PostEmbedRecord
    | PostEmbedRecordWithMedia
    | null;
  readonly createdAt: Date;
  readonly indexedAt: Date;

  constructor(params: PostParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.actorDid = asDid(params.actorDid);
    this.text = params.text;
    this.replyRoot = params.replyRoot ?? null;
    this.replyParent = params.replyParent ?? null;
    this.langs = params.langs;
    this.embed = params.embed;
    this.createdAt = params.createdAt;
    this.indexedAt = params.indexedAt;
  }

  get sortAt(): Date {
    return this.indexedAt < this.createdAt ? this.indexedAt : this.createdAt;
  }

  isReply(): boolean {
    return this.replyParent !== null || this.replyRoot !== null;
  }

  /**
   * embedのURIがインデックス可能なコレクションの場合そのURIを返す。
   * アプリケーション層でPostのインデックス時にこのURIのレコードもインデックスする。
   */
  getEmbedRecordUri(): AtUri | null {
    if (
      (this.embed instanceof PostEmbedRecord ||
        this.embed instanceof PostEmbedRecordWithMedia) &&
      ["app.bsky.feed.post", "app.bsky.feed.generator"].includes(
        this.embed.uri.collection,
      )
    ) {
      return this.embed.uri;
    }
    return null;
  }

  getReplyTargetUris(): AtUri[] {
    const uris = new Set<string>();
    if (this.replyParent) {
      uris.add(this.replyParent.uri.toString());
    }
    if (this.replyRoot) {
      uris.add(this.replyRoot.uri.toString());
    }
    return Array.from(uris).map((uri) => new AtUri(uri));
  }

  static from(record: Record) {
    const parsed = record.validate("app.bsky.feed.post");

    const embed = (() => {
      if (!parsed.embed) {
        return null;
      }
      if (
        parsed.embed.$type === "app.bsky.embed.images" &&
        "images" in parsed.embed
      ) {
        return PostEmbedImage.from(parsed.embed.images);
      }
      if (
        parsed.embed.$type === "app.bsky.embed.external" &&
        "external" in parsed.embed
      ) {
        return PostEmbedExternal.from(parsed.embed.external);
      }
      if (
        parsed.embed.$type === "app.bsky.embed.record" &&
        "record" in parsed.embed
      ) {
        return PostEmbedRecord.from(parsed.embed);
      }
      if (
        parsed.embed.$type === "app.bsky.embed.recordWithMedia" &&
        "record" in parsed.embed &&
        "media" in parsed.embed
      ) {
        return PostEmbedRecordWithMedia.from(parsed.embed);
      }
      return null;
    })();

    return new Post({
      uri: record.uri,
      cid: record.cid,
      actorDid: record.actorDid,
      text: parsed.text,
      replyRoot: getStrongRef(parsed.reply?.root),
      replyParent: getStrongRef(parsed.reply?.parent),
      langs: parsed.langs ?? [],
      embed,
      createdAt: new Date(parsed.createdAt),
      indexedAt: record.indexedAt,
    });
  }
}

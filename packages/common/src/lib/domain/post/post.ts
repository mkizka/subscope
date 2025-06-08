import { asDid, type Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";

import type { Record } from "../record.js";
import { PostEmbedExternal } from "./embed-external.js";
import { PostEmbedImage } from "./embed-images.js";

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

type PostParams = {
  uri: AtUri | string;
  cid: string;
  actorDid: string;
  text: string;
  replyRoot?: StrongRef | null;
  replyParent?: StrongRef | null;
  langs: string[] | null;
  embed: PostEmbedExternal | PostEmbedImage[] | null;
  createdAt: Date;
  sortAt?: Date | null;
};

export class Post {
  readonly uri: AtUri;
  readonly cid: string;
  readonly actorDid: Did;
  readonly text: string;
  readonly replyRoot: StrongRef | null;
  readonly replyParent: StrongRef | null;
  readonly langs: string[] | null;
  readonly embed: PostEmbedExternal | PostEmbedImage[] | null;
  readonly createdAt: Date;
  readonly sortAt: Date | null;

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
    this.sortAt = params.sortAt ?? null;
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
    });
  }
}

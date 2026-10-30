import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import external from "@repo/client/lex/app/bsky/embed/external";
import images from "@repo/client/lex/app/bsky/embed/images";
import embedRecord from "@repo/client/lex/app/bsky/embed/record";
import recordWithMedia from "@repo/client/lex/app/bsky/embed/recordWithMedia";
import { PostEmbedExternal } from "./embed-external.js";
import { PostEmbedImage } from "./embed-images.js";
import { PostEmbedRecord } from "./embed-record.js";
import { PostEmbedRecordWithMedia } from "./embed-record-with-media.js";
const getStrongRef = (ref) => {
  return (
    ref && {
      uri: new AtUri(ref.uri),
      cid: ref.cid,
    }
  );
};
export class Post {
  uri;
  cid;
  actorDid;
  text;
  replyRoot;
  replyParent;
  langs;
  embed;
  createdAt;
  indexedAt;
  constructor(params) {
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
  get sortAt() {
    return this.indexedAt < this.createdAt ? this.indexedAt : this.createdAt;
  }
  isReply() {
    return this.replyParent !== null || this.replyRoot !== null;
  }
  /**
   * embedのURIがインデックス可能なコレクションの場合そのURIを返す。
   * アプリケーション層でPostのインデックス時にこのURIのレコードもインデックスする。
   */
  getEmbedRecordUri() {
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
  getReplyTargetUris() {
    const uris = new Set();
    if (this.replyParent) {
      uris.add(this.replyParent.uri.toString());
    }
    if (this.replyRoot) {
      uris.add(this.replyRoot.uri.toString());
    }
    return Array.from(uris).map((uri) => new AtUri(uri));
  }
  static from(record) {
    const parsed = record.validate("app.bsky.feed.post");
    const embed = (() => {
      if (!parsed.embed) {
        return null;
      }
      if (images.isTypeOf(parsed.embed)) {
        return PostEmbedImage.from(parsed.embed.images);
      }
      if (external.isTypeOf(parsed.embed)) {
        return PostEmbedExternal.from(parsed.embed.external);
      }
      if (embedRecord.isTypeOf(parsed.embed)) {
        return PostEmbedRecord.from(parsed.embed);
      }
      if (recordWithMedia.isTypeOf(parsed.embed)) {
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

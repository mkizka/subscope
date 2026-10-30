import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
export class Repost {
  uri;
  cid;
  actorDid;
  subjectUri;
  subjectCid;
  createdAt;
  indexedAt;
  constructor(params) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.actorDid = asDid(params.actorDid);
    this.subjectUri = new AtUri(params.subjectUri.toString());
    this.subjectCid = params.subjectCid;
    this.createdAt = params.createdAt;
    this.indexedAt = params.indexedAt;
  }
  static from(record) {
    const parsed = record.validate("app.bsky.feed.repost");
    return new Repost({
      uri: record.uri,
      cid: record.cid,
      actorDid: record.actorDid,
      subjectUri: parsed.subject.uri,
      subjectCid: parsed.subject.cid,
      createdAt: new Date(parsed.createdAt),
      indexedAt: record.indexedAt,
    });
  }
  get sortAt() {
    return this.indexedAt < this.createdAt ? this.indexedAt : this.createdAt;
  }
}

import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
export class Follow {
  uri;
  cid;
  actorDid;
  subjectDid;
  createdAt;
  indexedAt;
  constructor(params) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.actorDid = asDid(params.actorDid);
    this.subjectDid = asDid(params.subjectDid);
    this.createdAt = params.createdAt;
    this.indexedAt = params.indexedAt;
  }
  get sortAt() {
    return this.indexedAt < this.createdAt ? this.indexedAt : this.createdAt;
  }
  static from(record) {
    const parsed = record.validate("app.bsky.graph.follow");
    return new Follow({
      uri: record.uri,
      cid: record.cid,
      actorDid: record.actorDid,
      subjectDid: parsed.subject,
      createdAt: new Date(parsed.createdAt),
      indexedAt: record.indexedAt,
    });
  }
}

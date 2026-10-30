import { asDid } from "@atproto/did";
import { getBlobCidString } from "@atproto/lex";
import { AtUri } from "@atproto/syntax";
export class List {
  uri;
  cid;
  actorDid;
  purpose;
  name;
  description;
  avatarCid;
  createdAt;
  indexedAt;
  constructor(params) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.actorDid = asDid(params.actorDid);
    this.purpose = params.purpose;
    this.name = params.name;
    this.description = params.description;
    this.avatarCid = params.avatarCid;
    this.createdAt = params.createdAt;
    this.indexedAt = params.indexedAt;
  }
  static from(record) {
    const parsed = record.validate("app.bsky.graph.list");
    return new List({
      uri: record.uri,
      cid: record.cid,
      actorDid: record.actorDid,
      purpose: parsed.purpose,
      name: parsed.name,
      description: parsed.description,
      avatarCid: getBlobCidString(parsed.avatar),
      createdAt: new Date(parsed.createdAt),
      indexedAt: record.indexedAt,
    });
  }
}

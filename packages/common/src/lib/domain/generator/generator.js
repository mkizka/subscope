import { asDid } from "@atproto/did";
import { getBlobCidString } from "@atproto/lex";
import { AtUri } from "@atproto/syntax";
export class Generator {
  uri;
  cid;
  actorDid;
  did;
  displayName;
  description;
  avatarCid;
  createdAt;
  indexedAt;
  constructor(params) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.actorDid = asDid(params.actorDid);
    this.did = asDid(params.did);
    this.displayName = params.displayName;
    this.description = params.description;
    this.avatarCid = params.avatarCid;
    this.createdAt = params.createdAt;
    this.indexedAt = params.indexedAt;
  }
  static from(record) {
    const parsed = record.validate("app.bsky.feed.generator");
    return new Generator({
      uri: record.uri,
      cid: record.cid,
      actorDid: record.actorDid,
      did: parsed.did,
      displayName: parsed.displayName,
      description: parsed.description,
      avatarCid: getBlobCidString(parsed.avatar),
      createdAt: new Date(parsed.createdAt),
      indexedAt: record.indexedAt,
    });
  }
}

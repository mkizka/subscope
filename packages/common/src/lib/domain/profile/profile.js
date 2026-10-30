import { asDid } from "@atproto/did";
import { getBlobCidString } from "@atproto/lex";
import { AtUri } from "@atproto/syntax";
export class Profile {
  uri;
  cid;
  actorDid;
  avatarCid;
  bannerCid;
  description;
  displayName;
  createdAt;
  indexedAt;
  constructor(params) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.actorDid = asDid(params.actorDid);
    this.avatarCid = params.avatarCid ?? null;
    this.bannerCid = params.bannerCid ?? null;
    this.description = params.description ?? null;
    this.displayName = params.displayName ?? null;
    this.createdAt = params.createdAt ? new Date(params.createdAt) : null;
    this.indexedAt = new Date(params.indexedAt);
  }
  static from(record) {
    const parsed = record.validate("app.bsky.actor.profile");
    return new Profile({
      uri: record.uri,
      cid: record.cid,
      actorDid: record.actorDid,
      avatarCid: getBlobCidString(parsed.avatar) ?? null,
      bannerCid: getBlobCidString(parsed.banner) ?? null,
      description: parsed.description,
      displayName: parsed.displayName,
      createdAt: parsed.createdAt,
      indexedAt: record.indexedAt,
    });
  }
}

import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
export class ListItem {
  uri;
  cid;
  actorDid;
  listUri;
  subjectDid;
  createdAt;
  indexedAt;
  constructor(params) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.actorDid = asDid(params.actorDid);
    this.listUri = new AtUri(params.listUri.toString());
    this.subjectDid = asDid(params.subjectDid);
    this.createdAt = params.createdAt;
    this.indexedAt = params.indexedAt;
  }
  static from(record) {
    const parsed = record.validate("app.bsky.graph.listitem");
    return new ListItem({
      uri: record.uri,
      cid: record.cid,
      actorDid: record.actorDid,
      listUri: parsed.list,
      subjectDid: parsed.subject,
      createdAt: new Date(parsed.createdAt),
      indexedAt: record.indexedAt,
    });
  }
}

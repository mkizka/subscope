import { AtUri } from "@atproto/syntax";
export class PostEmbedRecord {
  uri;
  cid;
  constructor(params) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
  }
  static from(record) {
    return new PostEmbedRecord({
      uri: record.record.uri,
      cid: record.record.cid,
    });
  }
}

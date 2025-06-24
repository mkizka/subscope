import { AtUri } from "@atproto/syntax";
import type { AppBskyEmbedRecord } from "@repo/client/server";

export class PostEmbedRecord {
  readonly uri: AtUri;
  readonly cid: string;

  constructor(uri: string, cid: string) {
    this.uri = new AtUri(uri);
    this.cid = cid;
  }

  static from(record: AppBskyEmbedRecord.Main) {
    return new PostEmbedRecord(record.record.uri, record.record.cid);
  }
}

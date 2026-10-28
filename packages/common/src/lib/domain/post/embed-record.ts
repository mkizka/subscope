import { AtUri } from "@atproto/syntax";
import type { app } from "@repo/client/lex";

type PostEmbedRecordParams = {
  uri: AtUri | string;
  cid: string;
};

export class PostEmbedRecord {
  readonly uri: AtUri;
  readonly cid: string;

  constructor(params: PostEmbedRecordParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
  }

  static from(record: app.bsky.embed.record.Main) {
    return new PostEmbedRecord({
      uri: record.record.uri,
      cid: record.record.cid,
    });
  }
}

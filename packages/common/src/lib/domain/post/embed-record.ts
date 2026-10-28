import { AtUri } from "@atproto/syntax";
import type { Main as EmbedRecord } from "@repo/client/lex/app/bsky/embed/record";

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

  static from(record: EmbedRecord) {
    return new PostEmbedRecord({
      uri: record.record.uri,
      cid: record.record.cid,
    });
  }
}

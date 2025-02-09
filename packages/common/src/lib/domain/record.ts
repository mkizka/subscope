import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";

type RecordParams = {
  uri: AtUri | string;
  cid: string;
  json: unknown;
  indexedAt?: Date | null;
};

export class Record {
  readonly uri: AtUri;
  readonly cid: string;
  readonly json: unknown;
  readonly indexedAt: Date | null;

  constructor(params: RecordParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.json = params.json;
    this.indexedAt = params.indexedAt ?? null;
  }

  get actorDid() {
    return asDid(this.uri.hostname);
  }
}

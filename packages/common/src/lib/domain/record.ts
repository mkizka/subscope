import { asDid } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

type RecordParams = {
  uri: AtUri;
  cid: string;
  json: unknown;
};

export class Record {
  readonly uri: AtUri;
  readonly cid: string;
  readonly json: unknown;

  constructor(params: RecordParams) {
    this.uri = params.uri;
    this.cid = params.cid;
    this.json = params.json;
  }

  get actorDid() {
    return asDid(this.uri.hostname);
  }
}

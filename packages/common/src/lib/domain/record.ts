import { asDid } from "@atproto/did";
import { jsonToLex, lexToJson } from "@atproto/lexicon";
import { AtUri } from "@atproto/syntax";

import { isSupportedCollection } from "../utils/collection.js";

type BaseRecordParams = {
  uri: AtUri | string;
  cid: string;
  indexedAt?: Date | null;
};

type LexRecordParams = BaseRecordParams & {
  lex: unknown;
};

type JsonRecordParams = BaseRecordParams & {
  json: unknown;
};

export class Record {
  readonly uri;
  readonly cid;
  private json;
  private lex;
  readonly indexedAt;

  private constructor(params: LexRecordParams & JsonRecordParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.json = params.json;
    this.lex = params.lex;
    this.indexedAt = params.indexedAt ?? null;
  }

  static fromLex(params: LexRecordParams) {
    return new Record({
      ...params,
      json: lexToJson(params.lex),
    });
  }

  static fromJson(params: JsonRecordParams) {
    return new Record({
      ...params,
      lex: jsonToLex(params.json),
    });
  }

  getLex() {
    return this.lex;
  }

  getJson() {
    return this.json;
  }

  get actorDid() {
    return asDid(this.uri.hostname);
  }

  getCollection() {
    if (!isSupportedCollection(this.uri.collection)) {
      throw new Error(`Unsupported collection: ${this.uri.collection}`);
    }
    return this.uri.collection;
  }
}

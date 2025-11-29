import { asDid } from "@atproto/did";
import { jsonToLex, lexToJson } from "@atproto/lexicon";
import { ValidationError } from "@atproto/lexicon";
import { AtUri } from "@atproto/syntax";
import { lexicons } from "@repo/client/server";

import type {
  SupportedCollection,
  SupportedCollectionMap,
} from "../../utils/collection.js";

type BaseRecordParams = {
  uri: AtUri | string;
  cid: string;
  indexedAt: Date;
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
  readonly json;
  private readonly lex;
  readonly indexedAt;

  private constructor(params: LexRecordParams & JsonRecordParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.json = params.json;
    this.lex = params.lex;
    this.indexedAt = params.indexedAt;
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

  get actorDid() {
    return asDid(this.uri.host);
  }

  get collection() {
    return this.uri.collection;
  }

  validate<T extends SupportedCollection>(collection: T) {
    try {
      lexicons.assertValidRecord(collection, this.lex);
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return this.lex as SupportedCollectionMap[T];
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new RecordValidationError(error.message, this.uri);
      }
      throw error;
    }
  }
}

export class RecordValidationError extends Error {
  constructor(message: string, uri: AtUri) {
    super(`Record validation error: ${message} for URI: ${uri.toString()}`);
    this.name = "RecordValidationError";
  }
}

import { asDid } from "@atproto/did";
import { jsonToLex, lexToJson } from "@atproto/lexicon";
import { ValidationError } from "@atproto/lexicon";
import { AtUri } from "@atproto/syntax";
import { lexicons } from "@repo/client/server";

import type {
  SupportedCollection,
  SupportedCollectionMap,
} from "../../utils/collection.js";

type RecordParams = {
  uri: AtUri | string;
  cid: string;
  lex: unknown;
  json: unknown;
  indexedAt?: Date;
};

export class Record {
  readonly uri;
  readonly cid;
  readonly json;
  private readonly lex;
  readonly indexedAt;

  private constructor(params: RecordParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.json = params.json;
    this.lex = params.lex;
    this.indexedAt = params.indexedAt ?? new Date();
  }

  static fromLex(params: Omit<RecordParams, "json">) {
    return new Record({
      ...params,
      json: lexToJson(params.lex),
    });
  }

  static fromJson(params: Omit<RecordParams, "lex">) {
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

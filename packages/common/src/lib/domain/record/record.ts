import { asDid } from "@atproto/did";
import { jsonToLex } from "@atproto/lexicon";
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

  static create(params: {
    uri: AtUri | string;
    cid: string;
    json: unknown;
  }): Record {
    return new Record({
      uri: params.uri,
      cid: params.cid,
      lex: jsonToLex(params.json),
      json: params.json,
      indexedAt: new Date(),
    });
  }

  static reconstruct(params: {
    uri: AtUri | string;
    cid: string;
    json: unknown;
    indexedAt: Date;
  }): Record {
    return new Record({
      uri: params.uri,
      cid: params.cid,
      lex: jsonToLex(params.json),
      json: params.json,
      indexedAt: params.indexedAt,
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

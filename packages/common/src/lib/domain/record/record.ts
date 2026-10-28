import { asDid } from "@atproto/did";
import { jsonToLex, type JsonValue } from "@atproto/lex";
import { AtUri } from "@atproto/syntax";

import {
  SUPPORTED_COLLECTION_SCHEMAS,
  type SupportedCollection,
  type SupportedCollectionMap,
} from "../../utils/collection.js";

type RecordParams = {
  uri: AtUri | string;
  cid: string;
  json: unknown;
  indexedAt?: Date;
};

export class Record {
  readonly uri;
  readonly cid;
  readonly json;
  readonly indexedAt;

  private constructor(params: RecordParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.json = params.json;
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
    const result = SUPPORTED_COLLECTION_SCHEMAS[collection].safeParse(
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      jsonToLex(this.json as JsonValue),
      { strict: false },
    );
    if (!result.success) {
      throw new RecordValidationError(result.reason.message, this.uri);
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return result.value as SupportedCollectionMap[T];
  }
}

export class RecordValidationError extends Error {
  constructor(message: string, uri: AtUri) {
    super(`Record validation error: ${message} for URI: ${uri.toString()}`);
    this.name = "RecordValidationError";
  }
}

import { asDid } from "@atproto/did";
import { jsonToLex } from "@atproto/lex";
import { AtUri } from "@atproto/syntax";
import { SUPPORTED_COLLECTION_SCHEMAS } from "../../utils/collection.js";
export class Record {
  uri;
  cid;
  json;
  indexedAt;
  constructor(params) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.json = params.json;
    this.indexedAt = params.indexedAt ?? new Date();
  }
  static create(params) {
    return new Record({
      uri: params.uri,
      cid: params.cid,
      json: params.json,
      indexedAt: new Date(),
    });
  }
  static reconstruct(params) {
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
  validate(collection) {
    const result = SUPPORTED_COLLECTION_SCHEMAS[collection].safeParse(
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      jsonToLex(this.json),
      { strict: false },
    );
    if (!result.success) {
      throw new RecordValidationError(result.reason.message, this.uri);
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return result.value;
  }
}
export class RecordValidationError extends Error {
  constructor(message, uri) {
    super(`Record validation error: ${message} for URI: ${uri.toString()}`);
    this.name = "RecordValidationError";
  }
}

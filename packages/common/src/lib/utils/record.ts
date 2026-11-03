import { jsonToLex, type JsonValue } from "@atproto/lex";
import type { AtUri } from "@atproto/syntax";

import {
  SUPPORTED_COLLECTION_SCHEMAS,
  type SupportedCollection,
  type SupportedCollectionMap,
} from "./collection.js";

export function validateRecord<T extends SupportedCollection>(
  collection: T,
  record: { uri: AtUri | string; json: unknown },
) {
  const result = SUPPORTED_COLLECTION_SCHEMAS[collection].safeParse(
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    jsonToLex(record.json as JsonValue),
    { strict: false },
  );
  if (!result.success) {
    throw new RecordValidationError(result.reason.message, record.uri);
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return result.value as SupportedCollectionMap[T];
}

export class RecordValidationError extends Error {
  constructor(message: string, uri: AtUri | string) {
    super(`Record validation error: ${message} for URI: ${uri.toString()}`);
    this.name = "RecordValidationError";
  }
}

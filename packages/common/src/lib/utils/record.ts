import { jsonToLex } from "@atproto/lexicon";
import { lexicons } from "@dawn/client";

import type {
  SupportedCollection,
  SupportedCollectionMap,
} from "./collection.js";

export const parseRecord = <T extends SupportedCollection>(
  lexUri: T,
  json: unknown,
) => {
  const value = jsonToLex(json);
  lexicons.assertValidRecord(lexUri, value);
  return value as SupportedCollectionMap[T];
};

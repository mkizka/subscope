import { lexicons } from "@dawn/client";

import type { Record } from "../domain/record.js";
import type {
  SupportedCollection,
  SupportedCollectionMap,
} from "./collection.js";

export const parseRecord = <T extends SupportedCollection>(
  lexUri: T,
  record: Record,
) => {
  const lex = record.getLex();
  lexicons.assertValidRecord(lexUri, lex);
  return lex as SupportedCollectionMap[T];
};

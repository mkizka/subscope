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
  lexicons.assertValidRecord(lexUri, record.lex);
  return record.lex as SupportedCollectionMap[T];
};

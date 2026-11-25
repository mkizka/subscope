import type { AtUri } from "@atproto/syntax";

export type Record = {
  uri: AtUri;
  cid: string;
  json: unknown;
  indexedAt: Date;
};

// Postgresには`\u0000`を含む文字列を保存できないため
export const hasNullCharacter = (record: Record) =>
  JSON.stringify(record.json).includes("\\u0000");

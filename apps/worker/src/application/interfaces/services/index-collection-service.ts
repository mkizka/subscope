import type { AtUri } from "@atproto/syntax";
import type { AfterCommitContext } from "@repo/common/interface";

import type { Record } from "../../dto/record.js";

export type Indexing = {
  live: boolean;
  depth: number;
  requestFetch: (uri: AtUri) => Promise<void>;
};

export interface ICollectionIndexer {
  shouldIndex?: ({
    ctx,
    record,
  }: {
    ctx: AfterCommitContext;
    record: Record;
  }) => Promise<boolean>;
  upsert: ({
    ctx,
    record,
    indexing,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    indexing: Indexing;
  }) => Promise<void>;
  afterAction?: ({
    ctx,
    record,
    action,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    action: "upsert" | "delete";
  }) => void | Promise<void>;
}

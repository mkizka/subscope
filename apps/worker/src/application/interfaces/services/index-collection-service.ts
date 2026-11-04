import type { AfterCommitContext } from "@repo/common/domain";

import type { Record } from "../../models/record.js";

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
    live,
    depth,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    live: boolean;
    depth: number;
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

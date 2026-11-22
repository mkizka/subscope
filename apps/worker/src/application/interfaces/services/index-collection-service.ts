import type { AfterCommitContext, Origin } from "@repo/common/interface";

import type { Record } from "../../dto/record.js";

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
    origin,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    origin: Origin;
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

import type { AfterCommitContext } from "@repo/common/interface";

import type { JobPriority, Origin } from "../../dto/origin.js";
import type { Record } from "../../dto/record.js";

export interface ICollectionIndexer {
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
  afterSkip?: ({
    ctx,
    record,
    origin,
    priority,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    origin: Origin;
    priority: JobPriority;
  }) => Promise<void>;
}

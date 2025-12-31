import type { Record, TransactionContext } from "@repo/common/domain";

export interface ICollectionIndexer {
  upsert: ({
    ctx,
    record,
    live,
    depth,
  }: {
    ctx: TransactionContext;
    record: Record;
    live: boolean;
    depth: number;
  }) => Promise<void>;
  afterAction?: ({
    ctx,
    record,
    action,
  }: {
    ctx: TransactionContext;
    record: Record;
    action: "upsert" | "delete";
  }) => Promise<void>;
}

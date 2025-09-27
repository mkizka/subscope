import type { Record, TransactionContext } from "@repo/common/domain";

export interface ICollectionIndexer {
  upsert: ({
    ctx,
    record,
    depth,
  }: {
    ctx: TransactionContext;
    record: Record;
    depth: number;
  }) => Promise<void>;
  shouldIndex: ({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }) => Promise<boolean>;
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

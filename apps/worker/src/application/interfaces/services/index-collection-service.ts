import type { Record, TransactionContext } from "@repo/common/domain";

export type IndexingContext = {
  live: boolean;
  depth: number;
};

export interface ICollectionIndexer {
  upsert: ({
    ctx,
    record,
    indexingCtx,
  }: {
    ctx: TransactionContext;
    record: Record;
    indexingCtx: IndexingContext;
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

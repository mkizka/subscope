import type { Record, TransactionContext } from "@repo/common/domain";

export interface IIndexCollectionService {
  upsert: ({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }) => Promise<void>;
  shouldSave: ({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }) => Promise<boolean>;
}

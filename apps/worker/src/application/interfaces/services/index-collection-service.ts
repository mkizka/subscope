import type { Record, TransactionContext } from "@dawn/common/domain";

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

import type { Record, TransactionContext } from "@dawn/common/domain";

export interface IIndexColectionService {
  upsert: ({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }) => Promise<void>;
}

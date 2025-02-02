import type { Record, TransactionContext } from "@dawn/common/domain";

export interface IRecordRepository {
  createOrUpdate: (params: {
    ctx: TransactionContext;
    record: Record;
  }) => Promise<void>;
}

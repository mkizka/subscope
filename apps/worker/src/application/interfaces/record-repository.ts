import type { AtUri } from "@atproto/syntax";
import type { Record, TransactionContext } from "@dawn/common/domain";

export interface IRecordRepository {
  createOrUpdate: (params: {
    ctx: TransactionContext;
    record: Record;
  }) => Promise<void>;

  delete: (params: { ctx: TransactionContext; uri: AtUri }) => Promise<void>;
}

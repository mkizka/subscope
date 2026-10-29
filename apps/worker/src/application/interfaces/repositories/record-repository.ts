import type { AtUri } from "@atproto/syntax";
import type { Record, TransactionContext } from "@repo/common/domain";

export interface IRecordRepository {
  findByUri: (params: {
    ctx: TransactionContext;
    uri: AtUri;
  }) => Promise<Record | null>;

  upsert: (params: {
    ctx: TransactionContext;
    record: Record;
  }) => Promise<void>;

  delete: (params: { ctx: TransactionContext; uri: AtUri }) => Promise<void>;
}

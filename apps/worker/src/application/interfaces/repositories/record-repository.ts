import type { AtUri } from "@atproto/syntax";
import type { Record, TransactionContext } from "@repo/common/domain";

export interface IRecordRepository {
  find: (params: {
    ctx: TransactionContext;
    uri: AtUri;
  }) => Promise<Record | null>;

  save: (params: { ctx: TransactionContext; record: Record }) => Promise<void>;

  delete: (params: { ctx: TransactionContext; uri: AtUri }) => Promise<void>;
}

import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";

import type { Record } from "../../dto/record.js";

export interface IRecordRepository {
  find: (params: {
    ctx: TransactionContext;
    uri: AtUri;
  }) => Promise<Record | null>;

  save: (params: { ctx: TransactionContext; record: Record }) => Promise<void>;

  delete: (params: { ctx: TransactionContext; uri: AtUri }) => Promise<void>;
}

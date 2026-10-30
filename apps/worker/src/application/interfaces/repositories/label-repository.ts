import type { Did } from "@atproto/did";
import type { JobData, TransactionContext } from "@repo/common/domain";

export interface ILabelRepository {
  upsert: (params: {
    ctx: TransactionContext;
    label: JobData["label"];
    actorDid: Did;
  }) => Promise<void>;
  delete: (params: {
    ctx: TransactionContext;
    label: JobData["label"];
  }) => Promise<void>;
}

import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/interface";

export interface IRepoRevRepository {
  save: (params: {
    ctx: TransactionContext;
    did: Did;
    rev: string;
  }) => Promise<void>;
}

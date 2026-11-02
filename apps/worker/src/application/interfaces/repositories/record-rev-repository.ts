import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";

export interface IRecordRevRepository {
  save: (params: {
    ctx: TransactionContext;
    uri: AtUri;
    rev: string;
  }) => Promise<boolean>;
}

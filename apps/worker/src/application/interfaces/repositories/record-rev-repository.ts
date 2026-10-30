import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";

export interface IRecordRevRepository {
  saveIfNotOlder: (params: {
    ctx: TransactionContext;
    uri: AtUri;
    rev: string;
  }) => Promise<boolean>;
}

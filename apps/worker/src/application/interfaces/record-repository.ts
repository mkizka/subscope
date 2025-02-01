import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@dawn/common/domain";

export interface IRecordRepository {
  createOrUpdate: (params: {
    ctx: TransactionContext;
    record: {
      uri: AtUri;
      cid: string;
      actorDid: Did;
      json: unknown;
    };
  }) => Promise<void>;
}

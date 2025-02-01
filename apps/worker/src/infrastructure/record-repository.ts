import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@dawn/common/domain";

import type { IRecordRepository } from "../application/interfaces/record-repository.js";

export class RecordRepository implements IRecordRepository {
  async createOrUpdate(params: {
    ctx: TransactionContext;
    record: {
      uri: AtUri;
      cid: string;
      actorDid: Did;
      json: unknown;
    };
  }) {
    // TODO: Implement
  }
}

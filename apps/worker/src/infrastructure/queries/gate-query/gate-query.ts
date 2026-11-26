import { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";

import type { IRecordRepository } from "../../../application/interfaces/repositories/record-repository.js";
import { Gate } from "../../../domain/gate.js";
import type { IGateQuery } from "../../../domain/interfaces/gate-query.js";

export class GateQuery implements IGateQuery {
  constructor(private readonly recordRepository: IRecordRepository) {}

  async findPostgate(ctx: TransactionContext, postUri: AtUri) {
    const record = await this.recordRepository.find({
      ctx,
      uri: AtUri.make(postUri.hostname, "app.bsky.feed.postgate", postUri.rkey),
    });
    return record && Gate.fromRecord(record);
  }
}

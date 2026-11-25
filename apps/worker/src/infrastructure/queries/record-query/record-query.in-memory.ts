import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";

import type { IRecordQuery } from "../../../application/interfaces/queries/record-query.js";
import type { InMemoryRecordRepository } from "../../repositories/record-repository/record-repository.in-memory.js";

export class InMemoryRecordQuery implements IRecordQuery {
  constructor(private readonly recordRepository: InMemoryRecordRepository) {}

  async exists(ctx: TransactionContext, uri: AtUri): Promise<boolean> {
    return (await this.recordRepository.find({ ctx, uri })) !== null;
  }
}

import type { AfterCommitContext } from "@repo/common/interface";

import { parseBlock } from "../../dto/block.js";
import type { Record } from "../../dto/record.js";
import type { IBlockRepository } from "../../interfaces/repositories/block-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";
import type { IndexAccountService } from "../index-account-service.js";

export class BlockIndexer implements ICollectionIndexer {
  constructor(
    private readonly blockRepository: IBlockRepository,
    private readonly indexAccountService: IndexAccountService,
  ) {}

  async upsert({
    ctx,
    record,
    live,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    live: boolean;
  }) {
    const block = parseBlock(record);
    await this.indexAccountService.upsert({
      ctx,
      did: block.subjectDid,
      live,
    });
    await this.blockRepository.save({ ctx, block });
  }
}

import type { Record, TransactionContext } from "@repo/common/domain";
import { Repost } from "@repo/common/domain";

import type { RepostIndexingPolicy } from "../../../domain/repost-indexing-policy.js";
import type { IRepostRepository } from "../../interfaces/repositories/repost-repository.js";
import type { IIndexCollectionService } from "../../interfaces/services/index-collection-service.js";

export class RepostIndexer implements IIndexCollectionService {
  constructor(
    private readonly repostRepository: IRepostRepository,
    private readonly repostIndexingPolicy: RepostIndexingPolicy,
  ) {}
  static inject = ["repostRepository", "repostIndexingPolicy"] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const repost = Repost.from(record);
    await this.repostRepository.upsert({ ctx, repost });
  }

  async shouldSave({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }): Promise<boolean> {
    const repost = Repost.from(record);
    return await this.repostIndexingPolicy.shouldIndex(ctx, repost);
  }
}

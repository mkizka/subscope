import type { Record, TransactionContext } from "@repo/common/domain";
import { Follow } from "@repo/common/domain";

import type { FollowIndexingPolicy } from "../../../domain/follow-indexing-policy.js";
import type { IFollowRepository } from "../../interfaces/repositories/follow-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

export class FollowIndexer implements ICollectionIndexer {
  constructor(
    private readonly followRepository: IFollowRepository,
    private readonly followIndexingPolicy: FollowIndexingPolicy,
  ) {}
  static inject = ["followRepository", "followIndexingPolicy"] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const follow = Follow.from(record);
    await this.followRepository.upsert({ ctx, follow });
  }

  async shouldIndex({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }): Promise<boolean> {
    const follow = Follow.from(record);
    return await this.followIndexingPolicy.shouldIndex(ctx, follow);
  }
}

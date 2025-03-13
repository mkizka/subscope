import type { Record, TransactionContext } from "@dawn/common/domain";
import { Follow } from "@dawn/common/domain";

import type { IFollowRepository } from "../interfaces/follow-repository.js";
import type { IIndexColectionService } from "../interfaces/index-collection-service.js";

export class IndexFollowService implements IIndexColectionService {
  constructor(private readonly followRepository: IFollowRepository) {}
  static inject = ["followRepository"] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const follow = Follow.from(record);
    await this.followRepository.upsert({ ctx, follow });
  }
}

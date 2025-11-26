import type { Record, TransactionContext } from "@repo/common/domain";
import { Profile } from "@repo/common/domain";

import type { ProfileIndexingPolicy } from "../../../domain/profile-indexing-policy.js";
import type { IProfileRepository } from "../../interfaces/repositories/profile-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

export class ProfileIndexer implements ICollectionIndexer {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly profileIndexingPolicy: ProfileIndexingPolicy,
  ) {}
  static inject = ["profileRepository", "profileIndexingPolicy"] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const profile = Profile.from(record);
    await this.profileRepository.upsert({ ctx, profile });
  }

  async shouldIndex({
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }): Promise<boolean> {
    const profile = Profile.from(record);
    return await this.profileIndexingPolicy.shouldIndex(profile);
  }
}

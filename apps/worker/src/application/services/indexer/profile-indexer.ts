import type { TransactionContext } from "@repo/common/interface";

import { parseProfile } from "../../dto/profile.js";
import type { Record } from "../../dto/record.js";
import type { IProfileRepository } from "../../interfaces/repositories/profile-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

export class ProfileIndexer implements ICollectionIndexer {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const profile = parseProfile(record);
    await this.profileRepository.save({ ctx, profile });
  }
}

import type { Record, TransactionContext } from "@repo/common/domain";

import type { IProfileRepository } from "../../interfaces/repositories/profile-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";
import { parseProfile } from "../../record-parsers.js";

export class ProfileIndexer implements ICollectionIndexer {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const profile = parseProfile(record);
    await this.profileRepository.save({ ctx, profile });
  }
}

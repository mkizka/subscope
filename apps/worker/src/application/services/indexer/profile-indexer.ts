import type { TransactionContext } from "@repo/common/interface";

import { parseProfile, type Profile } from "../../dto/profile.js";
import type { Record } from "../../dto/record.js";
import type { IProfileRepository } from "../../interfaces/repositories/profile-repository.js";
import type { ICollectionIndexer } from "./collection-indexer.js";

export class ProfileIndexer implements ICollectionIndexer<Profile> {
  constructor(private readonly profileRepository: IProfileRepository) {}

  parse(record: Record) {
    return parseProfile(record);
  }

  async save({ ctx, parsed }: { ctx: TransactionContext; parsed: Profile }) {
    await this.profileRepository.save({ ctx, profile: parsed });
  }
}

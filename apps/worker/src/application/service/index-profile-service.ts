import type { Record, TransactionContext } from "@dawn/common/domain";
import { Profile } from "@dawn/common/domain";

import type { IProfileRepository } from "../interfaces/profile-repository.js";

export class IndexProfileService {
  constructor(private readonly profileRepository: IProfileRepository) {}
  static inject = ["profileRepository"] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const profile = Profile.from(record);
    await this.profileRepository.upsert({ ctx, profile });
  }
}

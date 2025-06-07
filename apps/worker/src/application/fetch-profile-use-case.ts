import type { DatabaseClient } from "@dawn/common/domain";

import type { FetchProfileCommand } from "./fetch-profile-command.js";
import type { IProfileFetcher } from "./interfaces/profile-fetcher.js";
import type { IProfileRepository } from "./interfaces/profile-repository.js";

export class FetchProfileUseCase {
  constructor(
    private readonly profileFetcher: IProfileFetcher,
    private readonly profileRepository: IProfileRepository,
    private readonly db: DatabaseClient,
  ) {}
  static inject = ["profileFetcher", "profileRepository", "db"] as const;

  async execute({ did, jobLogger }: FetchProfileCommand): Promise<void> {
    const profile = await this.profileFetcher.fetch(did);
    if (!profile) {
      await jobLogger.log(`Profile not found for DID: ${did}`);
      return;
    }
    const ctx = { db: this.db };
    await this.profileRepository.upsert({ ctx, profile });
  }
}

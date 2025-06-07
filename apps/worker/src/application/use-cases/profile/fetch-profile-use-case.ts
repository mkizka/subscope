import type { DatabaseClient } from "@dawn/common/domain";
import { Profile } from "@dawn/common/domain";

import type { IProfileRecordFetcher } from "../../interfaces/external/profile-record-fetcher.js";
import type { IProfileRepository } from "../../interfaces/repositories/profile-repository.js";
import type { IRecordRepository } from "../../interfaces/repositories/record-repository.js";
import type { FetchProfileCommand } from "./fetch-profile-command.js";

export class FetchProfileUseCase {
  constructor(
    private readonly profileRecordFetcher: IProfileRecordFetcher,
    private readonly recordRepository: IRecordRepository,
    private readonly profileRepository: IProfileRepository,
    private readonly db: DatabaseClient,
  ) {}
  static inject = [
    "profileRecordFetcher",
    "recordRepository",
    "profileRepository",
    "db",
  ] as const;

  async execute({ did, jobLogger }: FetchProfileCommand): Promise<void> {
    const record = await this.profileRecordFetcher.fetch(did);
    if (!record) {
      await jobLogger.log(`Profile not found for DID: ${did}`);
      return;
    }
    const ctx = { db: this.db };
    await this.recordRepository.upsert({ ctx, record });
    await this.profileRepository.upsert({ ctx, profile: Profile.from(record) });
  }
}

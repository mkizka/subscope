import type { Did } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";
import { Profile } from "@repo/common/domain";

import type { JobLogger } from "../../../shared/job.js";
import type { IProfileRecordFetcher } from "../../interfaces/external/profile-record-fetcher.js";
import type { IProfileRepository } from "../../interfaces/repositories/profile-repository.js";
import type { IRecordRepository } from "../../interfaces/repositories/record-repository.js";

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

  async execute({
    did,
    jobLogger,
  }: {
    did: Did;
    jobLogger: JobLogger;
  }): Promise<void> {
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

import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@repo/common/domain";

import type { JobLogger } from "../../../shared/job.js";
import type { IProfileRecordFetcher } from "../../interfaces/external/profile-record-fetcher.js";
import type { IndexCommitService } from "../../services/index-commit-service.js";

export class FetchProfileUseCase {
  constructor(
    private readonly profileRecordFetcher: IProfileRecordFetcher,
    private readonly transactionManager: ITransactionManager,
    private readonly indexCommitService: IndexCommitService,
  ) {}
  static inject = [
    "profileRecordFetcher",
    "transactionManager",
    "indexCommitService",
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
    await this.transactionManager.transaction(async (ctx) => {
      await this.indexCommitService.upsert({
        ctx,
        record,
        jobLogger,
      });
    });
  }
}

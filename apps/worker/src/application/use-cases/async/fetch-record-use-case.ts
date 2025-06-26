import { AtUri } from "@atproto/syntax";
import type { ITransactionManager } from "@repo/common/domain";

import type { JobLogger } from "../../../shared/job.js";
import type { IRecordFetcher } from "../../interfaces/external/record-fetcher.js";
import type { IndexCommitService } from "../../services/index-commit-service.js";

export class FetchRecordUseCase {
  constructor(
    private readonly recordFetcher: IRecordFetcher,
    private readonly transactionManager: ITransactionManager,
    private readonly indexCommitService: IndexCommitService,
  ) {}
  static inject = [
    "recordFetcher",
    "transactionManager",
    "indexCommitService",
  ] as const;

  async execute({
    uri,
    jobLogger,
  }: {
    uri: string;
    jobLogger: JobLogger;
  }): Promise<void> {
    const atUri = new AtUri(uri);
    const record = await this.recordFetcher.fetch(atUri);
    if (!record) {
      await jobLogger.log(`Record not found for URI: ${uri}`);
      return;
    }
    await this.transactionManager.transaction(async (ctx) => {
      await this.indexCommitService.upsert({
        ctx,
        record,
        jobLogger,
        // サブスクライバーでない、いいねしたアカウントのプロフィールなどルール外のレコードもインデックスする
        force: true,
      });
    });
  }
}

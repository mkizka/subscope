import { AtUri } from "@atproto/syntax";
import type { ITransactionManager } from "@repo/common/domain";

import type { JobLogger } from "../../../shared/job.js";
import {
  type IRecordFetcher,
  RecordFetchError,
} from "../../interfaces/external/record-fetcher.js";
import type { IndexRecordService } from "../../services/index-record-service.js";

export class FetchRecordUseCase {
  constructor(
    private readonly recordFetcher: IRecordFetcher,
    private readonly transactionManager: ITransactionManager,
    private readonly indexRecordService: IndexRecordService,
  ) {}
  static inject = [
    "recordFetcher",
    "transactionManager",
    "indexRecordService",
  ] as const;

  async execute({
    uri,
    jobLogger,
  }: {
    uri: string;
    jobLogger: JobLogger;
  }): Promise<void> {
    try {
      await this.doFetchRecord(uri, jobLogger);
    } catch (error) {
      if (error instanceof RecordFetchError) {
        await jobLogger.log(error.message);
        return;
      }
      throw error;
    }
  }

  private async doFetchRecord(
    uri: string,
    jobLogger: JobLogger,
  ): Promise<void> {
    const atUri = new AtUri(uri);
    const record = await this.recordFetcher.fetch(atUri);
    await this.transactionManager.transaction(async (ctx) => {
      await this.indexRecordService.upsert({
        ctx,
        record,
        jobLogger,
        // サブスクライバーでない、いいねしたアカウントのプロフィールなどルール外のレコードもインデックスする
        force: true,
      });
    });
  }
}

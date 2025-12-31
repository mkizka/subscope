import { AtUri } from "@atproto/syntax";
import {
  type ITransactionManager,
  RecordValidationError,
} from "@repo/common/domain";

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
    depth,
    live,
    jobLogger,
  }: {
    uri: string;
    depth: number;
    live: boolean;
    jobLogger: JobLogger;
  }): Promise<void> {
    // 深さが2以上の場合は処理を中止
    //
    // 例:
    //   引用投稿
    //   -> 引用された投稿(0)
    //   → さらに引用された投稿(1)
    //   → さらにさらに引用された投稿(2なので中止)
    if (depth >= 2) {
      await jobLogger.log(
        `Skipping fetch for ${uri} - depth limit reached (depth: ${depth})`,
      );
      return;
    }
    try {
      await this.doFetchRecord(uri, depth, live, jobLogger);
    } catch (error) {
      if (
        error instanceof RecordFetchError ||
        error instanceof RecordValidationError
      ) {
        await jobLogger.log(error.message);
        return;
      }
      throw error;
    }
  }

  private async doFetchRecord(
    uri: string,
    depth: number,
    live: boolean,
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
        live,
        depth: depth + 1,
      });
    });
  }
}

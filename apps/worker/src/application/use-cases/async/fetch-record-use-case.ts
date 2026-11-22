import { AtUri } from "@atproto/syntax";
import {
  type ITransactionManager,
  type PdsOrigin,
} from "@repo/common/interface";
import { RecordValidationError } from "@repo/common/utils";

import type { JobLogger } from "../../../shared/job.js";
import {
  type IRecordFetcher,
  RecordFetchError,
} from "../../interfaces/external/record-fetcher.js";
import type { IndexRecordService } from "../../services/index-record-service.js";

const MAX_HOP = 2;

export class FetchRecordUseCase {
  constructor(
    private readonly recordFetcher: IRecordFetcher,
    private readonly transactionManager: ITransactionManager,
    private readonly indexRecordService: IndexRecordService,
  ) {}

  async execute({
    uri,
    origin,
    jobLogger,
  }: {
    uri: string;
    origin: PdsOrigin;
    jobLogger: JobLogger;
  }): Promise<void> {
    // 例:
    //   引用投稿(Tap)
    //   -> 引用された投稿(1段目)
    //   -> さらに引用された投稿(2段目)
    //   -> さらにさらに引用された投稿(3段目なので中止)
    if (origin.hop > MAX_HOP) {
      await jobLogger.log(
        `Skipping fetch for ${uri} - hop limit reached (hop: ${origin.hop})`,
      );
      return;
    }
    try {
      await this.doFetchRecord(uri, origin);
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

  private async doFetchRecord(uri: string, origin: PdsOrigin): Promise<void> {
    const atUri = new AtUri(uri);
    const record = await this.recordFetcher.fetch(atUri);
    await this.transactionManager.transaction(async (ctx) => {
      const shouldIndex = await this.indexRecordService.shouldIndex({
        ctx,
        record,
      });
      if (!shouldIndex) {
        return;
      }
      await this.indexRecordService.upsert({ ctx, record, origin });
    });
  }
}

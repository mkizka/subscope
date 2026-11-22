import { AtUri } from "@atproto/syntax";
import { type ITransactionManager } from "@repo/common/interface";
import { RecordValidationError } from "@repo/common/utils";

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
    try {
      await this.doFetchRecord(uri, depth, live);
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
  ): Promise<void> {
    const atUri = new AtUri(uri);
    const record = await this.recordFetcher.fetch(atUri);
    await this.transactionManager.transaction((ctx) =>
      this.indexRecordService.index({
        ctx,
        record,
        origin: { type: "pds", hop: depth + 1 },
        priority: live ? "high" : "low",
      }),
    );
  }
}

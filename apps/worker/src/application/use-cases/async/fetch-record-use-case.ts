import { AtUri } from "@atproto/syntax";
import {
  type ITransactionManager,
  type JobPriority,
} from "@repo/common/interface";
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
    hop,
    priority,
    jobLogger,
  }: {
    uri: string;
    hop: number;
    priority: JobPriority;
    jobLogger: JobLogger;
  }): Promise<void> {
    try {
      await this.doFetchRecord(uri, hop, priority);
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
    hop: number,
    priority: JobPriority,
  ): Promise<void> {
    const atUri = new AtUri(uri);
    const record = await this.recordFetcher.fetch(atUri);
    await this.transactionManager.transaction((ctx) =>
      this.indexRecordService.index({
        ctx,
        record,
        origin: { type: "pds", hop },
        priority,
      }),
    );
  }
}

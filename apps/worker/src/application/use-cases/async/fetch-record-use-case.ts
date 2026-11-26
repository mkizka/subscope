import { AtUri } from "@atproto/syntax";
import { type ITransactionManager } from "@repo/common/interface";
import { RecordValidationError } from "@repo/common/utils";

import { Origin } from "../../../domain/origin.js";
import type { JobLogger } from "../../../shared/job.js";
import {
  type IRecordFetcher,
  RecordFetchError,
} from "../../interfaces/external/record-fetcher.js";
import type { RecordIndexer } from "../../services/indexer/record-indexer.js";

export class FetchRecordUseCase {
  constructor(
    private readonly recordFetcher: IRecordFetcher,
    private readonly transactionManager: ITransactionManager,
    private readonly recordIndexer: RecordIndexer,
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
      this.recordIndexer.index({
        ctx,
        record,
        origin: Origin.fromFetchJob({ live, depth }),
      }),
    );
  }
}

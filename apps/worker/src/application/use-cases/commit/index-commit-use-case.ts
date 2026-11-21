import { asDid } from "@atproto/did";
import {
  type ILoggerManager,
  type ITransactionManager,
  type TransactionContext,
} from "@repo/common/interface";
import { RecordValidationError, validateRecord } from "@repo/common/utils";

import type { Record } from "../../dto/record.js";
import type { IRegistrationQuery } from "../../interfaces/queries/registration-query.js";
import type { ITrackingRepository } from "../../interfaces/repositories/tracking-repository.js";
import type { IndexRecordService } from "../../services/index-record-service.js";
import type { IndexCommitCommand } from "./index-commit-command.js";

const PAST_LIMITED_COLLECTIONS = [
  "app.bsky.feed.post",
  "app.bsky.feed.repost",
  "app.bsky.feed.like",
] as const;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export class IndexCommitUseCase {
  private readonly logger;

  constructor(
    loggerManager: ILoggerManager,
    private readonly transactionManager: ITransactionManager,
    private readonly indexRecordService: IndexRecordService,
    private readonly registrationQuery: IRegistrationQuery,
    private readonly trackingRepository: ITrackingRepository,
  ) {
    this.logger = loggerManager.createLogger("IndexCommitUseCase");
  }

  async execute(command: IndexCommitCommand) {
    try {
      await this.doIndexCommit(command);
    } catch (error) {
      if (error instanceof RecordValidationError) {
        this.logger.warn({ uri: command.commit.uri.toString() }, error.message);
        return;
      }
      throw error;
    }
  }

  private async doIndexCommit({ commit, live }: IndexCommitCommand) {
    await this.transactionManager.transaction(async (ctx) => {
      if (
        commit.operation !== "delete" &&
        ((!live && (await this.isBeforeTracking(ctx, commit.record))) ||
          !(await this.indexRecordService.shouldIndex({
            ctx,
            record: commit.record,
          })))
      ) {
        return;
      }
      switch (commit.operation) {
        case "create":
        case "update": {
          await this.indexRecordService.upsert({
            ctx,
            record: commit.record,
            live,
            depth: 0,
          });
          break;
        }
        case "delete": {
          // Related data is also deleted by cascade
          await this.indexRecordService.delete({ ctx, uri: commit.uri });
          break;
        }
      }
    });
  }

  private async isBeforeTracking(ctx: TransactionContext, record: Record) {
    const collection = PAST_LIMITED_COLLECTIONS.find(
      (collection) => collection === record.uri.collection,
    );
    if (!collection) {
      return false;
    }
    const did = asDid(record.uri.host);
    if (await this.registrationQuery.isRegistered(ctx, did)) {
      return false;
    }
    const tracking = await this.trackingRepository.find({ ctx, did });
    if (!tracking) {
      return false;
    }
    const { createdAt } = validateRecord(collection, record);
    return (
      new Date(createdAt).getTime() < tracking.trackedAt.getTime() - ONE_DAY_MS
    );
  }
}

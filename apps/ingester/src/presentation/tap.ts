import { asDid } from "@atproto/did";
import type { RecordEvent } from "@atproto/tap";
import { SimpleIndexer, Tap } from "@atproto/tap";
import type {
  CommitEventDto,
  IdentityEventDto,
  ILoggerManager,
} from "@repo/common/domain";
import { asHandle, isSupportedCollection } from "@repo/common/utils";

import type { HandleCommitUseCase } from "../application/handle-commit-use-case.js";
import type { HandleIdentityUseCase } from "../application/handle-identity-use-case.js";
import { env } from "../shared/env.js";

export class TapIngester {
  private readonly tap;
  private readonly indexer;
  private readonly logger;

  constructor(
    loggerManager: ILoggerManager,
    private readonly handleCommitUseCase: HandleCommitUseCase,
    private readonly handleIdentityUseCase: HandleIdentityUseCase,
  ) {
    this.logger = loggerManager.createLogger("TapIngester");
    this.tap = new Tap(env.TAP_URL);
    this.indexer = new SimpleIndexer();

    this.indexer.record(async (event) => {
      const dto = this.recordEventToDto(event);
      if (dto) await this.handleCommitUseCase.execute(dto);
    });

    this.indexer.identity(async (event) => {
      const identityDto: IdentityEventDto = {
        identity: {
          did: asDid(event.did),
          handle: event.handle ? asHandle(event.handle) : undefined,
        },
      };
      await this.handleIdentityUseCase.execute(identityDto);
    });

    this.indexer.error((error) => {
      this.logger.error(error, "Tap error occurred");
    });
  }

  static inject = [
    "loggerManager",
    "handleCommitUseCase",
    "handleIdentityUseCase",
  ] as const;

  private recordEventToDto(event: RecordEvent): CommitEventDto | null {
    if (!isSupportedCollection(event.collection)) {
      return null;
    }
    if (event.action === "delete") {
      return {
        did: asDid(event.did),
        commit: {
          operation: event.action,
          collection: event.collection,
          rkey: event.rkey,
        },
      };
    } else {
      if (event.record === undefined || event.cid === undefined) {
        this.logger.warn(
          { event },
          "RecordEvent missing record or cid for non-delete action",
        );
        return null;
      }
      return {
        did: asDid(event.did),
        commit: {
          operation: event.action,
          collection: event.collection,
          rkey: event.rkey,
          record: event.record,
          cid: event.cid,
        },
      };
    }
  }

  async start() {
    const channel = this.tap.channel(this.indexer);

    this.logger.info(`Tap connection starting at ${env.TAP_URL}`);

    await channel.start();
  }
}

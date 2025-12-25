import { asDid } from "@atproto/did";
import type { RecordEvent } from "@atproto/tap";
import { SimpleIndexer, Tap } from "@atproto/tap";
import type {
  CommitEventDto,
  IdentityEventDto,
  ILoggerManager,
} from "@repo/common/domain";
import { asHandle, isSupportedCollection, required } from "@repo/common/utils";
import { setTimeout as sleep } from "timers/promises";

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
      return {
        did: asDid(event.did),
        commit: {
          operation: event.action,
          collection: event.collection,
          rkey: event.rkey,
          record: required(event.record),
          cid: required(event.cid),
        },
      };
    }
  }

  async start() {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const channel = this.tap.channel(this.indexer);
      this.logger.info(`Tap connection starting at ${env.TAP_URL}`);

      try {
        await channel.start();
        this.logger.warn("Tap connection ended cleanly");
      } catch (error) {
        this.logger.error(error, "Tap connection failed, will restart");
      } finally {
        await channel.destroy();
      }

      this.logger.info("Restarting tap connection in 5 seconds...");
      await sleep(5000);
    }
  }
}

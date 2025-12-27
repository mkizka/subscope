import {
  TapClient,
  type TapIdentityEvent,
  type TapRecordEvent,
} from "@atcute/tap";
import type {
  CommitEventDto,
  IdentityEventDto,
  ILoggerManager,
} from "@repo/common/domain";
import { isSupportedCollection, required } from "@repo/common/utils";

import type { HandleCommitUseCase } from "../application/handle-commit-use-case.js";
import type { HandleIdentityUseCase } from "../application/handle-identity-use-case.js";
import { env } from "../shared/env.js";

export class TapIngester {
  private readonly tap;
  private readonly logger;

  constructor(
    loggerManager: ILoggerManager,
    private readonly handleCommitUseCase: HandleCommitUseCase,
    private readonly handleIdentityUseCase: HandleIdentityUseCase,
  ) {
    this.logger = loggerManager.createLogger("TapIngester");
    this.tap = new TapClient({ url: env.TAP_URL });
  }

  static inject = [
    "loggerManager",
    "handleCommitUseCase",
    "handleIdentityUseCase",
  ] as const;

  private recordEventToDto(event: TapRecordEvent): CommitEventDto | null {
    if (!isSupportedCollection(event.collection)) {
      return null;
    }
    if (event.action === "delete") {
      return {
        did: event.did,
        commit: {
          operation: event.action,
          collection: event.collection,
          rkey: event.rkey,
        },
      };
    } else {
      return {
        did: event.did,
        commit: {
          operation: event.action,
          collection: event.collection,
          rkey: event.rkey,
          record: required(event.record),
          cid: event.cid,
        },
      };
    }
  }

  private identityEventToDto(event: TapIdentityEvent): IdentityEventDto {
    return {
      identity: {
        did: event.did,
        handle: event.handle,
      },
    };
  }

  async start() {
    this.logger.info(`Tap connection starting at ${env.TAP_URL}`);

    const subscription = this.tap.subscribe({
      onConnectionOpen: () => {
        this.logger.info("Tap connection opened");
      },
      onConnectionClose: (event) => {
        this.logger.info(
          { code: event.code, reason: event.reason },
          "Tap connection closed",
        );
      },
      onConnectionError: (error) => {
        this.logger.error(error, "Tap connection error occurred");
      },
      onError: (error) => {
        this.logger.error(error, "Tap error occurred");
      },
    });

    for await (const { event, ack } of subscription) {
      try {
        if (event.type === "record") {
          const dto = this.recordEventToDto(event);
          if (dto) await this.handleCommitUseCase.execute(dto);
        } else {
          const dto = this.identityEventToDto(event);
          await this.handleIdentityUseCase.execute(dto);
        }
        await ack();
      } catch (error) {
        this.logger.error(error, "Failed to process tap event");
      }
    }
  }
}

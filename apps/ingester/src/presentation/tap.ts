import { asDid } from "@atproto/did";
import type { RecordEvent } from "@atproto/tap";
import { SimpleIndexer, Tap } from "@atproto/tap";
import type {
  CommitEventDto,
  IdentityEventDto,
  ILoggerManager,
} from "@repo/common/domain";
import { isSupportedCollection } from "@repo/common/utils";

import type { HandleCommitUseCase } from "../application/handle-commit-use-case.js";
import type { HandleIdentityUseCase } from "../application/handle-identity-use-case.js";

export class TapIngester {
  private readonly tap;
  private readonly indexer;
  private readonly logger;

  constructor(
    loggerManager: ILoggerManager,
    private readonly tapUrl: string,
    private readonly handleCommitUseCase: HandleCommitUseCase,
    private readonly handleIdentityUseCase: HandleIdentityUseCase,
  ) {
    this.logger = loggerManager.createLogger("TapIngester");
    this.tap = new Tap(this.tapUrl);
    this.indexer = new SimpleIndexer();

    this.indexer.record(async (event) => {
      const dto = this.recordEventToDto(event);
      if (dto) await this.handleCommitUseCase.execute(dto);
    });

    this.indexer.identity(async (event) => {
      const identityDto: IdentityEventDto = {
        identity: {
          did: event.did,
          handle: event.handle,
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
    "tapUrl",
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
        live: event.live,
        commit: {
          operation: event.action,
          collection: event.collection,
          rkey: event.rkey,
        },
      };
    }
    if (event.record === undefined || event.cid === undefined) {
      this.logger.warn(
        { event },
        "RecordEvent missing record or cid for non-delete action",
      );
      return null;
    }
    return {
      did: asDid(event.did),
      live: event.live,
      commit: {
        operation: event.action,
        collection: event.collection,
        rkey: event.rkey,
        record: event.record,
        cid: event.cid,
      },
    };
  }

  async start() {
    const channel = this.tap.channel(this.indexer, {
      // 初回同期で大量のイベントが流れる間は処理が追いつかずsocketが一時停止し、
      // pongを読めず既定(10s)のheartbeatが健全な接続を誤ってterminateするため間隔を伸ばす
      heartbeatIntervalMs: 60_000,
    });

    this.logger.info(`Tap connection starting at ${this.tapUrl}`);

    await channel.start();
  }
}

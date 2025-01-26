import type { ILoggerManager, Logger } from "@dawn/common/domain";
import { Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";

import { env } from "../shared/env.js";
import type { QueueService } from "./queue.js";

export class JetstreamIngester {
  private readonly jetstream: Jetstream;
  private readonly logger: Logger;

  constructor(
    loggerManager: ILoggerManager,
    private readonly queueService: QueueService,
  ) {
    this.logger = loggerManager.createLogger("JetstreamIngester");
    this.jetstream = new Jetstream({
      ws: WebSocket,
      cursor: env.NODE_ENV === "development" ? -1 : undefined,
      endpoint: env.JETSTREAM_URL,
      wantedCollections: ["app.bsky.actor.profile"],
    });

    this.jetstream.on("open", () => {
      this.logger.info(
        `jetstream subscription started to ${env.JETSTREAM_URL}`,
      );
    });

    this.jetstream.on("close", () => {
      this.logger.info(`jetstream subscription closed`);
    });

    this.jetstream.on("error", (error) => {
      this.logger.error(error, "jetstream error occurred");
    });

    // イベントを発行するサービスでアカウント ホスティング ステータスが変更された可能性があること、および新しいステータスが何であるかを示します。
    // たとえば、アカウントの作成、削除、または一時停止の結果である可能性があります。イベントは、変更された内容ではなく、現在のホスティング ステータスを説明します。
    // https://atproto.com/ja/specs/sync
    this.jetstream.on("account", async (event) => {
      // TODO: アカウントステータスの変動を実装
    });

    // 指定された ID (DID ドキュメントまたはハンドル) に変更があった可能性があること、およびオプションで現在のハンドルが何であるかを示します。
    // 何が変更されたかを示すものではなく、ID の現在の状態が何であるかを確実に示すものでもありません。
    // https://atproto.com/ja/specs/sync
    this.jetstream.on("identity", async (event) => {
      this.logger.debug({ did: event.identity.did }, "identity event received");
      await this.queueService.addTask("identity", event);
    });

    this.jetstream.on("app.bsky.actor.profile", async (event) => {
      this.logger.debug(
        { did: event.did },
        "app.bsky.actor.profile event received",
      );
      await this.queueService.addTask("app.bsky.actor.profile", event);
    });
  }
  static inject = ["loggerManager", "queueService"] as const;

  start() {
    this.jetstream.start();
  }
}

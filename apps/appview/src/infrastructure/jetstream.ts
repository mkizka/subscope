import { Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";

import type { SyncProfileUseCase } from "../application/sync-profile.js";
import type { SyncUserUseCase } from "../application/sync-user.js";
import type { IIngester } from "../domain/repositories/ingester.js";
import { env } from "../shared/env.js";
import { createLogger } from "../shared/logger.js";

const logger = createLogger("JetstreamIngester");

export class JetstreamIngester implements IIngester {
  constructor(
    private syncUserUseCase: SyncUserUseCase,
    private syncProfileUseCase: SyncProfileUseCase,
  ) {}
  static inject = ["syncUserUseCase", "syncProfileUseCase"] as const;

  start() {
    const jetstream = new Jetstream({
      ws: WebSocket,
      cursor: env.NODE_ENV === "development" ? -1 : undefined,
      endpoint: env.JETSTREAM_URL,
      wantedCollections: ["app.bsky.actor.profile"],
    });

    jetstream.on("open", () => {
      logger.info(`Jetstream subscription started to ${env.JETSTREAM_URL}`);
    });

    jetstream.on("close", () => {
      logger.info(`Jetstream subscription closed`);
    });

    jetstream.on("error", (error) => {
      logger.error(error, "Jetstream error occurred");
    });

    // イベントを発行するサービスでアカウント ホスティング ステータスが変更された可能性があること、および新しいステータスが何であるかを示します。
    // たとえば、アカウントの作成、削除、または一時停止の結果である可能性があります。イベントは、変更された内容ではなく、現在のホスティング ステータスを説明します。
    // https://atproto.com/ja/specs/sync
    jetstream.on("account", (event) => {
      // TODO: アカウントステータスの変動を実装
    });

    // 指定された ID (DID ドキュメントまたはハンドル) に変更があった可能性があること、およびオプションで現在のハンドルが何であるかを示します。
    // 何が変更されたかを示すものではなく、ID の現在の状態が何であるかを確実に示すものでもありません。
    // https://atproto.com/ja/specs/sync
    jetstream.on("identity", async (event) => {
      const user = {
        did: event.identity.did,
        handle: event.identity.handle,
      };
      logger.debug(user, "identity event received");
      await this.syncUserUseCase.execute(user);
    });

    jetstream.onCreate("app.bsky.actor.profile", async (event) => {
      const profile = {
        did: event.did,
        // avatar: event.commit.record.avatar,
        description: event.commit.record.description,
        displayName: event.commit.record.displayName,
      };
      logger.debug(event, "Profile created");
      await this.syncProfileUseCase.execute(profile);
    });

    jetstream.onUpdate("app.bsky.actor.profile", (event) => {
      logger.info(event, "Profile updated");
    });

    jetstream.start();
  }
}

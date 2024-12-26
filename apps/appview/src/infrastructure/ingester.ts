import { Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";

import type { IIngester } from "../application/server.js";
import { env } from "../shared/env.js";
import { createLogger } from "../shared/logger.js";
import type { UserRepository } from "./user-repository.js";

const logger = createLogger("JetstreamIngester");

export class Ingester implements IIngester {
  constructor(private userRepository: UserRepository) {}
  static inject = ["userRepository"] as const;

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
      const dto = {
        did: event.identity.did,
        handle: event.identity.handle,
      };
      logger.debug(dto, "identity event received");
      await this.userRepository.createOrUpdate(dto);
    });

    jetstream.onCreate("app.bsky.actor.profile", (event) => {
      logger.info(event, "Profile created");
    });

    jetstream.onUpdate("app.bsky.actor.profile", (event) => {
      logger.info(event, "Profile updated");
    });

    jetstream.start();
  }
}

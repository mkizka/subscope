import { asDid } from "@atproto/did";
import type { ILoggerManager, Logger } from "@dawn/common/domain";
import type { CommitCreateEvent, CommitUpdateEvent } from "@skyware/jetstream";
import { Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";

import type { SyncActorUseCase } from "../../application/sync-actor-use-case.js";
import type { SyncPostUseCase } from "../../application/sync-post-use-case.js";
import type { SyncProfileUseCase } from "../../application/sync-profile-use-case.js";
import { env } from "../../shared/env.js";

export class JetstreamIngester {
  private readonly jetstream: Jetstream;
  private readonly logger: Logger;

  constructor(
    loggerManager: ILoggerManager,
    private syncActorUseCase: SyncActorUseCase,
    private syncProfileUseCase: SyncProfileUseCase,
    private syncPostUseCase: SyncPostUseCase,
  ) {
    this.logger = loggerManager.createLogger("JetstreamIngester");
    this.jetstream = new Jetstream({
      ws: WebSocket,
      cursor: env.NODE_ENV === "development" ? -1 : undefined,
      endpoint: env.JETSTREAM_URL,
      wantedCollections: ["app.bsky.actor.profile", "app.bsky.feed.post"],
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
      await this.syncActorUseCase.execute({
        did: event.identity.did,
        handle: event.identity.handle,
      });
    });

    this.jetstream.onCreate("app.bsky.actor.profile", async (event) => {
      await this.handleProfileChanged(event);
    });

    this.jetstream.onUpdate("app.bsky.actor.profile", async (event) => {
      await this.handleProfileChanged(event);
    });

    this.jetstream.onCreate("app.bsky.feed.post", async (event) => {
      await this.handlePostChanged(event);
    });

    this.jetstream.onUpdate("app.bsky.feed.post", async (event) => {
      await this.handlePostChanged(event);
    });
  }
  static inject = [
    "loggerManager",
    "syncActorUseCase",
    "syncProfileUseCase",
    "syncPostUseCase",
  ] as const;

  private async handleProfileChanged(
    event:
      | CommitCreateEvent<"app.bsky.actor.profile">
      | CommitUpdateEvent<"app.bsky.actor.profile">,
  ) {
    this.logger.debug(
      { did: event.did },
      "app.bsky.actor.profile event received",
    );
    await this.syncProfileUseCase.execute({
      did: asDid(event.did),
      avatar: event.commit.record.avatar
        ? {
            cid: event.commit.record.avatar.ref.$link,
            mimeType: event.commit.record.avatar.mimeType,
            size: event.commit.record.avatar.size,
          }
        : null,
      description: event.commit.record.description ?? null,
      displayName: event.commit.record.displayName ?? null,
      createdAt: event.commit.record.createdAt ?? null,
    });
  }

  private async handlePostChanged(
    event:
      | CommitCreateEvent<"app.bsky.feed.post">
      | CommitUpdateEvent<"app.bsky.feed.post">,
  ) {
    this.logger.debug({ did: event.did }, "app.bsky.actor.post event received");
    await this.syncPostUseCase.execute({
      rkey: event.commit.rkey,
      actorDid: asDid(event.did),
      text: event.commit.record.text,
      langs: event.commit.record.langs ?? [],
      createdAt: new Date(event.commit.record.createdAt),
    });
  }

  start() {
    this.jetstream.start();
  }
}

import { Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";

import type { ICreateUserUseCase } from "../application/create-user-use-case.js";
import type { IIngester } from "../application/start-ingestion-use-case.js";
import { env } from "../shared/env.js";
import { createLogger } from "../shared/logger.js";

const logger = createLogger("jetstream-ingester");

export class JetstreamIngester implements IIngester {
  constructor(private createUserUseCase: ICreateUserUseCase) {}
  static inject = ["createUserUseCase"] as const;

  start() {
    const jetstream = new Jetstream({
      ws: WebSocket,
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

    jetstream.onCreate("app.bsky.actor.profile", (event) => {
      logger.info(event, "Profile created");
    });

    jetstream.onUpdate("app.bsky.actor.profile", (event) => {
      logger.info(event, "Profile updated");
    });

    jetstream.start();
  }
}

import { Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";

import { env } from "../shared/env.js";
import { createLogger } from "../shared/logger.js";
import type { UserRepository } from "./user-repository.js";

const logger = createLogger("JetstreamIngester");

export class JetstreamIngester {
  constructor(private userRepository: UserRepository) {}
  static inject = ["userRepository"] as const;

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

    jetstream.on("commit", (commit) => {
      logger.debug(commit, "Jetstream commit received");
    });

    jetstream.on("account", (account) => {
      logger.debug(account, "Jetstream account event received");
    });

    jetstream.on("identity", async (event) => {
      logger.debug(event, "Jetstream identity event received");
      await this.userRepository.create({
        did: event.identity.did,
        handle: event.identity.handle,
      });
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

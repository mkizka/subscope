/* eslint-disable no-console */
import { Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";

import type { ICreateUserUseCase } from "../application/create-user-use-case.js";
import type { IIngester } from "../application/start-ingestion-use-case.js";
import { env } from "../env.js";

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
      console.info(`Jetstream subscription started to ${env.JETSTREAM_URL}`);
    });

    jetstream.on("close", () => {
      console.info(`Jetstream subscription closed`);
    });

    jetstream.on("error", (error) => {
      console.error(error, "Jetstream error occurred");
    });

    jetstream.onCreate("app.bsky.actor.profile", (event) => {
      console.info(event, "Profile created");
    });

    jetstream.onUpdate("app.bsky.actor.profile", (event) => {
      console.info(event, "Profile updated");
    });

    jetstream.start();
  }
}

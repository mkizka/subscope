import { Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";

import { env } from "./env.js";
import { createLogger } from "./logger.js";

const logger = createLogger("jetstream");

export const jetstream = new Jetstream({
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

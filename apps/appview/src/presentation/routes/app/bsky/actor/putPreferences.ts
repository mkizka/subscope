import type { Server } from "@repo/client/server";

export class PutPreferences {
  handle(server: Server) {
    server.app.bsky.actor.putPreferences({
      handler: () => {},
    });
  }
}

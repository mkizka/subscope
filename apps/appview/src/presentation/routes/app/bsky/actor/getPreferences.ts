import type { Server } from "@repo/client/server";

export class GetPreferences {
  handle(server: Server) {
    server.app.bsky.actor.getPreferences({
      handler: () => {
        return {
          encoding: "application/json",
          body: {
            preferences: [],
          },
        };
      },
    });
  }
}

import type { Server } from "@repo/client/server";

export class ListNotifications {
  static inject = [] as const;

  handle(server: Server) {
    server.app.bsky.notification.listNotifications({
      handler: () => {
        return {
          encoding: "application/json",
          body: {
            notifications: [],
          },
        };
      },
    });
  }
}

import updateSeen from "@repo/client/lex/app/bsky/notification/updateSeen";

import type { INotificationCommand } from "@/app/server/application/interfaces/notification-command";
import type { IOAuthClient } from "@/app/server/application/interfaces/oauth-client";

export const notificationCommandFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): INotificationCommand => ({
  async updateSeen(did, seenAt) {
    const agent = await oauthClient.restore(did);
    if (!agent) throw new Error("Failed to restore OAuth session");
    await agent.call(updateSeen, { seenAt });
  },
});

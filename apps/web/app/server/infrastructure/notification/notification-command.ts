import type { DatetimeString } from "@atproto/syntax";
import updateSeen from "@repo/client/lex/app/bsky/notification/updateSeen";

import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";

export interface INotificationCommand {
  updateSeen: (did: string, seenAt: DatetimeString) => Promise<void>;
}

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

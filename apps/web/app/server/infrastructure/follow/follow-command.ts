import { AtUri, currentDatetimeString } from "@atproto/syntax";
import follow from "@repo/client/lex/app/bsky/graph/follow";

import type { IFollowCommand } from "@/app/server/application/interfaces/follow-command";
import type { IOAuthClient } from "@/app/server/application/interfaces/oauth-client";

export const followCommandFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IFollowCommand => {
  const restore = async (did: string) => {
    const agent = await oauthClient.restore(did);
    if (!agent) throw new Error("Failed to restore OAuth session");
    return agent;
  };
  return {
    async create(did, subject) {
      const agent = await restore(did);
      const { uri } = await agent.create(follow, {
        subject,
        createdAt: currentDatetimeString(),
      });
      return uri;
    },
    async delete(did, uri) {
      const agent = await restore(did);
      await agent.delete(follow, { rkey: new AtUri(uri).rkey });
    },
  };
};

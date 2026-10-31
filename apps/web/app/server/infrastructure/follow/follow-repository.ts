import { AtUri, currentDatetimeString } from "@atproto/syntax";
import follow from "@repo/client/lex/app/bsky/graph/follow";

import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";

export interface IFollowRepository {
  create: (did: string, subject: `did:${string}:${string}`) => Promise<string>;
  delete: (did: string, uri: string) => Promise<void>;
}

export const followRepositoryFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IFollowRepository => {
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

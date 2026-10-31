import { asAtUriString, AtUri, currentDatetimeString } from "@atproto/syntax";
import like from "@repo/client/lex/app/bsky/feed/like";
import repost from "@repo/client/lex/app/bsky/feed/repost";

import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";

type ReactionType = "like" | "repost";

export interface IReactionCommand {
  create: (
    did: string,
    type: ReactionType,
    subject: { uri: string; cid: string },
  ) => Promise<string>;
  delete: (did: string, type: ReactionType, uri: string) => Promise<void>;
}

const schemas = { like, repost };

export const reactionCommandFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IReactionCommand => {
  const restore = async (did: string) => {
    const agent = await oauthClient.restore(did);
    if (!agent) throw new Error("Failed to restore OAuth session");
    return agent;
  };
  return {
    async create(did, type, subject) {
      const agent = await restore(did);
      const { uri } = await agent.create(schemas[type], {
        subject: { uri: asAtUriString(subject.uri), cid: subject.cid },
        createdAt: currentDatetimeString(),
      });
      return uri;
    },
    async delete(did, type, uri) {
      const agent = await restore(did);
      await agent.delete(schemas[type], { rkey: new AtUri(uri).rkey });
    },
  };
};

import { Client } from "@atproto/lex";
import type { AtIdentifierString } from "@atproto/syntax";
import getRegisteredFollowers from "@repo/client/lex/me/subsco/graph/getRegisteredFollowers";

import { env } from "@/app/server/env";

export interface IFollowQuery {
  findRegisteredFollowers: (
    subject: AtIdentifierString,
    limit: number,
  ) => Promise<{ total: number; dids: string[] }>;
}

export const followQueryFactory = (): IFollowQuery => {
  const publicClient = new Client(env.APPVIEW_URL);
  return {
    async findRegisteredFollowers(subject, limit) {
      const { total, followers } = await publicClient.call(
        getRegisteredFollowers,
        { actor: subject, limit },
      );
      return { total, dids: followers.map((follower) => follower.did) };
    },
  };
};

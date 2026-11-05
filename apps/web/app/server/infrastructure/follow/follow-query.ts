import { Client } from "@atproto/lex";
import getRegisteredFollowers from "@repo/client/me/subsco/graph/getRegisteredFollowers";

import type { IFollowQuery } from "@/app/server/application/interfaces/follow-query";
import { env } from "@/app/server/env";

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

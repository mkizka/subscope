import { Client } from "@atproto/lex";
import getServerMemberFollowers from "@repo/client/me/subsco/graph/getServerMemberFollowers";

import type { IFollowQuery } from "@/app/server/application/interfaces/follow-query";
import { env } from "@/app/server/env";

export const followQueryFactory = (): IFollowQuery => {
  const publicClient = new Client(env.APPVIEW_URL);
  return {
    async findRegisteredFollowers(subject, limit) {
      const { total, followers } = await publicClient.call(
        getServerMemberFollowers,
        { actor: subject, limit },
      );
      return { total, dids: followers.map((follower) => follower.did) };
    },
  };
};

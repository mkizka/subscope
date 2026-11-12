import { Client } from "@atproto/lex";
import getServerMemberFollowers from "@repo/client/me/subsco/graph/getServerMemberFollowers";

import type { IFollowQuery } from "@/app/server/application/interfaces/follow-query";

export const followQueryFactory = ({
  appviewUrl,
}: {
  appviewUrl: string;
}): IFollowQuery => {
  const publicClient = new Client(appviewUrl);
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

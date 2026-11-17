import { Client } from "@atproto/lex";
import getServerMemberFollowers from "@repo/client/me/subsco/graph/getServerMemberFollowers";

import type { IFollowQuery } from "@/app/server/application/interfaces/follow-query";
import type { Env } from "@/app/server/env";

export const followQueryFactory = ({
  env,
}: {
  env: Pick<Env, "APPVIEW_URL">;
}): IFollowQuery => {
  const publicClient = new Client(env.APPVIEW_URL);
  return {
    async findRegisteredFollowers(subject) {
      const { followers } = await publicClient.call(getServerMemberFollowers, {
        actor: subject,
        limit: 100,
      });
      return followers.map((follower) => follower.did);
    },
  };
};

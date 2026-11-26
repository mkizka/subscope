import { Client } from "@atproto/lex";
import getFollowedAccounts from "@repo/client/me/subsco/server/getFollowedAccounts";
import getOperator from "@repo/client/me/subsco/server/getOperator";
import getServerMembers from "@repo/client/me/subsco/server/getServerMembers";
import getSetupStatus from "@repo/client/me/subsco/server/getSetupStatus";
import getRegistrationStatus, {
  member,
} from "@repo/client/me/subsco/sync/getRegistrationStatus";

import type { IOAuthClient } from "@/app/server/application/interfaces/oauth-client";
import type { ISubscopeQuery } from "@/app/server/application/interfaces/subscope-query";
import type { Env } from "@/app/server/env";

export const subscopeQueryFactory = ({
  env,
  oauthClient,
}: {
  env: Pick<Env, "APPVIEW_URL">;
  oauthClient: IOAuthClient;
}): ISubscopeQuery => {
  const publicClient = new Client(env.APPVIEW_URL);

  const restore = async (did: string) => {
    const agent = await oauthClient.restore(did);
    if (!agent) {
      throw new Error(`OAuth session not found: ${did}`);
    }
    return agent;
  };

  return {
    async isInitialized() {
      const { initialized } = await publicClient.call(getSetupStatus);
      return initialized;
    },
    async isMember(did) {
      const response = await (await restore(did)).call(getRegistrationStatus);
      return member.isTypeOf(response);
    },
    async findOperator() {
      const { operator } = await publicClient.call(getOperator);
      return (
        operator && {
          did: operator.did,
          handle: operator.handle,
          displayName: operator.displayName,
          avatarUrl: operator.avatar,
        }
      );
    },
    async findMembers(q) {
      // ponytail: 最初の100件のみ。続きの読み込みはcursorを使うAPIルートを足すとき
      const { serverMembers } = await publicClient.call(getServerMembers, {
        limit: 100,
        q,
      });
      return {
        serverMembers: serverMembers.map(({ profile, isAdmin }) => ({
          did: profile.did,
          handle: profile.handle,
          displayName: profile.displayName,
          avatarUrl: profile.avatar,
          description: profile.description,
          isAdmin,
        })),
      };
    },
    async findFollowedAccounts(did, q) {
      // ponytail: 最初の100件のみ。続きの読み込みはcursorを使うAPIルートを足すとき
      const { followedAccounts } = await (
        await restore(did)
      ).call(getFollowedAccounts, { limit: 100, q });
      return {
        accounts: followedAccounts.map(({ profile, memberFollowersCount }) => ({
          did: profile.did,
          handle: profile.handle,
          displayName: profile.displayName,
          avatarUrl: profile.avatar,
          memberFollowersCount,
        })),
      };
    },
  };
};

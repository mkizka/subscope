import { Client } from "@atproto/lex";
import getFollowedAccounts from "@repo/client/me/subsco/server/getFollowedAccounts";
import getRegisteredAccounts from "@repo/client/me/subsco/server/getRegisteredAccounts";
import getSetupStatus from "@repo/client/me/subsco/server/getSetupStatus";
import getRegistrationStatus, {
  registered,
} from "@repo/client/me/subsco/sync/getRegistrationStatus";

import type { IOAuthClient } from "@/app/server/application/interfaces/oauth-client";
import type { ISubscopeQuery } from "@/app/server/application/interfaces/subscope-query";
import { env } from "@/app/server/env";

export const subscopeQueryFactory = ({
  oauthClient,
}: {
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
    async isRegistered(did) {
      const response = await (await restore(did)).call(getRegistrationStatus);
      return registered.isTypeOf(response);
    },
    async findMembers(q) {
      // ponytail: 最初の100件のみ。続きの読み込みはcursorを使うAPIルートを足すとき
      const { registeredAccounts, cursor } = await publicClient.call(
        getRegisteredAccounts,
        {
          limit: 100,
          q,
        },
      );
      return {
        registeredAccounts: registeredAccounts.map(({ profile, isAdmin }) => ({
          did: profile.did,
          handle: profile.handle,
          displayName: profile.displayName,
          avatarUrl: profile.avatar,
          description: profile.description,
          isAdmin,
        })),
        hasMore: cursor !== undefined,
      };
    },
    async findFollowedAccounts(did, q) {
      // ponytail: 最初の100件のみ。続きの読み込みはcursorを使うAPIルートを足すとき
      const { followedAccounts, total } = await (
        await restore(did)
      ).call(getFollowedAccounts, { limit: 100, q });
      return {
        total,
        accounts: followedAccounts.map(
          ({ profile, registeredFollowersCount }) => ({
            did: profile.did,
            handle: profile.handle,
            displayName: profile.displayName,
            avatarUrl: profile.avatar,
            registeredFollowersCount,
          }),
        ),
      };
    },
  };
};

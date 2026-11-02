import { Client } from "@atproto/lex";
import getRegisteredAccounts from "@repo/client/lex/me/subsco/server/getRegisteredAccounts";
import getSetupStatus from "@repo/client/lex/me/subsco/server/getSetupStatus";
import getTrackedAccounts from "@repo/client/lex/me/subsco/server/getTrackedAccounts";
import getRegistrationStatus, {
  registered,
} from "@repo/client/lex/me/subsco/sync/getRegistrationStatus";
import type { BackfillStatus } from "@repo/common/domain";

import { env } from "@/app/server/env";
import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";

export type MembersDto = {
  registeredAccounts: {
    did: string;
    handle: string;
    displayName?: string;
    avatarUrl?: string;
    description?: string;
    isAdmin: boolean;
    backfillStatus?: BackfillStatus;
  }[];
  hasMore: boolean;
};

export type TrackedAccountsDto = {
  total: number;
  actors: {
    did: string;
    handle: string;
    displayName?: string;
    avatarUrl?: string;
    registeredFollowersCount: number;
    backfillStatus?: BackfillStatus;
  }[];
};

export interface ISubscopeQuery {
  isInitialized: () => Promise<boolean>;
  isRegistered: (did: string) => Promise<boolean>;
  findMembers: () => Promise<MembersDto>;
  findTrackedAccounts: (did: string) => Promise<TrackedAccountsDto>;
}

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
    async findMembers() {
      // ponytail: 最初の100件のみ。続きの読み込みはcursorを使うAPIルートを足すとき
      const { registeredAccounts, cursor } = await publicClient.call(
        getRegisteredAccounts,
        {
          limit: 100,
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
    async findTrackedAccounts(did) {
      // ponytail: 最初の100件のみ。続きの読み込みはcursorを使うAPIルートを足すとき
      const { trackedAccounts, total } = await (
        await restore(did)
      ).call(getTrackedAccounts, { limit: 100 });
      return {
        total,
        actors: trackedAccounts.map(
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

import { Client, XrpcResponseError } from "@atproto/lex";
import registerAdmin from "@repo/client/lex/me/subsco/admin/registerAdmin";
import getMembers from "@repo/client/lex/me/subsco/server/getMembers";
import getSetupStatus from "@repo/client/lex/me/subsco/server/getSetupStatus";
import getTrackedActors from "@repo/client/lex/me/subsco/server/getTrackedActors";
import getSubscriptionStatus, {
  subscribed,
} from "@repo/client/lex/me/subsco/sync/getSubscriptionStatus";
import subscribeServer from "@repo/client/lex/me/subsco/sync/subscribeServer";

import { env } from "@/app/server/env";
import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";

export type SubscribeResult = "subscribed" | "invalidInviteCode" | "failed";

export interface ISubscopeRepository {
  isInitialized: () => Promise<boolean>;
  registerAdmin: (did: string) => Promise<void>;
  isSubscribed: (did: string) => Promise<boolean>;
  subscribe: (did: string, inviteCode: string) => Promise<SubscribeResult>;
  findMembers: () => Promise<{
    members: {
      did: string;
      handle: string;
      displayName?: string;
      avatarUrl?: string;
      description?: string;
      isAdmin: boolean;
    }[];
    hasMore: boolean;
  }>;
  findTrackedActors: (did: string) => Promise<{
    total: number;
    actors: {
      did: string;
      handle: string;
      displayName?: string;
      avatarUrl?: string;
      subscriberFollowersCount: number;
    }[];
  }>;
}

export const subscopeRepositoryFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): ISubscopeRepository => {
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
    async registerAdmin(did) {
      await (await restore(did)).call(registerAdmin);
    },
    async isSubscribed(did) {
      const response = await (await restore(did)).call(getSubscriptionStatus);
      return subscribed.isTypeOf(response);
    },
    async subscribe(did, inviteCode) {
      try {
        await (await restore(did)).call(subscribeServer, { inviteCode });
        return "subscribed";
      } catch (e) {
        if (e instanceof XrpcResponseError) {
          switch (e.error) {
            case "InvalidInviteCode":
              return "invalidInviteCode";
            case "AlreadySubscribed":
              return "subscribed";
          }
        }
        return "failed";
      }
    },
    async findMembers() {
      // ponytail: 最初の100件のみ。続きの読み込みはcursorを使うAPIルートを足すとき
      const { members, cursor } = await publicClient.call(getMembers, {
        limit: 100,
      });
      return {
        members: members.map(({ profile, isAdmin }) => ({
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
    async findTrackedActors(did) {
      // ponytail: 最初の100件のみ。続きの読み込みはcursorを使うAPIルートを足すとき
      const { trackedActors, total } = await (
        await restore(did)
      ).call(getTrackedActors, { limit: 100 });
      return {
        total,
        actors: trackedActors.map(({ profile, subscriberFollowersCount }) => ({
          did: profile.did,
          handle: profile.handle,
          displayName: profile.displayName,
          avatarUrl: profile.avatar,
          subscriberFollowersCount,
        })),
      };
    },
  };
};

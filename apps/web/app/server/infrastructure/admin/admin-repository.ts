import type { DidString } from "@atproto/syntax";
import banSubscriber from "@repo/client/lex/me/subsco/admin/banSubscriber";
import getBannedActors, {
  type $OutputBody as GetBannedActorsOutput,
} from "@repo/client/lex/me/subsco/admin/getBannedActors";
import getSubscribers, {
  type $OutputBody as GetSubscribersOutput,
} from "@repo/client/lex/me/subsco/admin/getSubscribers";
import grantAdmin from "@repo/client/lex/me/subsco/admin/grantAdmin";
import unbanActor from "@repo/client/lex/me/subsco/admin/unbanActor";

import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";

export interface IAdminRepository {
  getSubscribers: (
    did: string,
    cursor?: string,
  ) => Promise<GetSubscribersOutput>;
  banSubscriber: (did: string, target: DidString) => Promise<void>;
  grantAdmin: (did: string, target: DidString) => Promise<void>;
  getBannedActors: (
    did: string,
    cursor?: string,
  ) => Promise<GetBannedActorsOutput>;
  unbanActor: (did: string, target: DidString) => Promise<void>;
}

export const adminRepositoryFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IAdminRepository => {
  const restore = async (did: string) => {
    const agent = await oauthClient.restore(did);
    if (!agent) {
      throw new Error("Failed to restore OAuth session");
    }
    return agent;
  };

  return {
    async getSubscribers(did, cursor) {
      const agent = await restore(did);
      return agent.call(getSubscribers, { limit: 20, cursor });
    },
    async banSubscriber(did, target) {
      const agent = await restore(did);
      await agent.call(banSubscriber, { did: target });
    },
    async grantAdmin(did, target) {
      const agent = await restore(did);
      await agent.call(grantAdmin, { did: target });
    },
    async getBannedActors(did, cursor) {
      const agent = await restore(did);
      return agent.call(getBannedActors, { limit: 20, cursor });
    },
    async unbanActor(did, target) {
      const agent = await restore(did);
      await agent.call(unbanActor, { did: target });
    },
  };
};

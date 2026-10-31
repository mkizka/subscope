import getBannedActors, {
  type $OutputBody as GetBannedActorsOutput,
} from "@repo/client/lex/me/subsco/admin/getBannedActors";
import getInviteCodes, {
  type $OutputBody as GetInviteCodesOutput,
} from "@repo/client/lex/me/subsco/admin/getInviteCodes";
import getSubscribers, {
  type $OutputBody as GetSubscribersOutput,
} from "@repo/client/lex/me/subsco/admin/getSubscribers";

import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";

export interface IAdminQuery {
  getSubscribers: (
    did: string,
    cursor?: string,
  ) => Promise<GetSubscribersOutput>;
  getBannedActors: (
    did: string,
    cursor?: string,
  ) => Promise<GetBannedActorsOutput>;
  getInviteCodes: (
    did: string,
    cursor?: string,
  ) => Promise<GetInviteCodesOutput>;
}

export const adminQueryFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IAdminQuery => {
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
    async getBannedActors(did, cursor) {
      const agent = await restore(did);
      return agent.call(getBannedActors, { limit: 20, cursor });
    },
    async getInviteCodes(did, cursor) {
      const agent = await restore(did);
      return agent.call(getInviteCodes, { limit: 20, cursor });
    },
  };
};

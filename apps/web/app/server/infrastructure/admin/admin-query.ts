import getBannedAccounts from "@repo/client/me/subsco/admin/getBannedAccounts";
import getInviteCodes from "@repo/client/me/subsco/admin/getInviteCodes";
import listServerMembers from "@repo/client/me/subsco/admin/listServerMembers";

import type { IAdminQuery } from "@/app/server/application/interfaces/admin-query";
import type { IOAuthClient } from "@/app/server/application/interfaces/oauth-client";

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
    async listServerMembers(did, cursor) {
      const agent = await restore(did);
      return agent.call(listServerMembers, { limit: 20, cursor });
    },
    async getBannedAccounts(did, cursor) {
      const agent = await restore(did);
      return agent.call(getBannedAccounts, { limit: 20, cursor });
    },
    async getInviteCodes(did, cursor) {
      const agent = await restore(did);
      return agent.call(getInviteCodes, { limit: 20, cursor });
    },
  };
};

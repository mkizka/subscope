import getBannedAccounts from "@repo/client/lex/me/subsco/admin/getBannedAccounts";
import getInviteCodes from "@repo/client/lex/me/subsco/admin/getInviteCodes";
import listRegisteredAccounts from "@repo/client/lex/me/subsco/admin/listRegisteredAccounts";

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
    async listRegisteredAccounts(did, cursor) {
      const agent = await restore(did);
      return agent.call(listRegisteredAccounts, { limit: 20, cursor });
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

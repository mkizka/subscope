import getBannedAccounts, {
  type $OutputBody as GetBannedAccountsOutput,
} from "@repo/client/lex/me/subsco/admin/getBannedAccounts";
import getInviteCodes, {
  type $OutputBody as GetInviteCodesOutput,
} from "@repo/client/lex/me/subsco/admin/getInviteCodes";
import listRegisteredAccounts, {
  type $OutputBody as ListRegisteredAccountsOutput,
} from "@repo/client/lex/me/subsco/admin/listRegisteredAccounts";

import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";

export interface IAdminQuery {
  listRegisteredAccounts: (
    did: string,
    cursor?: string,
  ) => Promise<ListRegisteredAccountsOutput>;
  getBannedAccounts: (
    did: string,
    cursor?: string,
  ) => Promise<GetBannedAccountsOutput>;
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

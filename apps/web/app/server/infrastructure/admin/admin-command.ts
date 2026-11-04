import banAccount from "@repo/client/lex/me/subsco/admin/banAccount";
import createInviteCode from "@repo/client/lex/me/subsco/admin/createInviteCode";
import deleteInviteCode from "@repo/client/lex/me/subsco/admin/deleteInviteCode";
import grantAdmin from "@repo/client/lex/me/subsco/admin/grantAdmin";
import unbanAccount from "@repo/client/lex/me/subsco/admin/unbanAccount";

import type { IAdminCommand } from "@/app/server/application/interfaces/admin-command";
import type { IOAuthClient } from "@/app/server/application/interfaces/oauth-client";

export const adminCommandFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IAdminCommand => {
  const restore = async (did: string) => {
    const agent = await oauthClient.restore(did);
    if (!agent) {
      throw new Error("Failed to restore OAuth session");
    }
    return agent;
  };

  return {
    async banAccount(did, target) {
      const agent = await restore(did);
      await agent.call(banAccount, { did: target });
    },
    async grantAdmin(did, target) {
      const agent = await restore(did);
      await agent.call(grantAdmin, { did: target });
    },
    async unbanAccount(did, target) {
      const agent = await restore(did);
      await agent.call(unbanAccount, { did: target });
    },
    async createInviteCode(did) {
      const agent = await restore(did);
      return agent.call(createInviteCode, { daysToExpire: 7 });
    },
    async deleteInviteCode(did, code) {
      const agent = await restore(did);
      await agent.call(deleteInviteCode, { code });
    },
  };
};

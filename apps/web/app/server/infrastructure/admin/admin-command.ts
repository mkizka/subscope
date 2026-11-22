import { XrpcResponseError } from "@atproto/lex";
import addMember from "@repo/client/me/subsco/admin/addMember";
import banAccount from "@repo/client/me/subsco/admin/banAccount";
import createInviteCode from "@repo/client/me/subsco/admin/createInviteCode";
import deleteInviteCode from "@repo/client/me/subsco/admin/deleteInviteCode";
import grantAdmin from "@repo/client/me/subsco/admin/grantAdmin";

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
    async addMember(did, actor) {
      const agent = await restore(did);
      try {
        await agent.call(addMember, { actor });
        return "added";
      } catch (e) {
        if (e instanceof XrpcResponseError) {
          switch (e.error) {
            case "AccountNotFound":
              return "accountNotFound";
            case "AlreadyRegistered":
              return "alreadyRegistered";
            case "Banned":
              return "banned";
          }
        }
        throw e;
      }
    },
    async banAccount(did, target) {
      const agent = await restore(did);
      await agent.call(banAccount, { did: target });
    },
    async grantAdmin(did, target) {
      const agent = await restore(did);
      await agent.call(grantAdmin, { did: target });
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

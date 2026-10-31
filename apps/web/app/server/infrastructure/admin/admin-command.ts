import type { DidString } from "@atproto/syntax";
import banSubscriber from "@repo/client/lex/me/subsco/admin/banSubscriber";
import createInviteCode, {
  type $OutputBody as CreateInviteCodeOutput,
} from "@repo/client/lex/me/subsco/admin/createInviteCode";
import deleteInviteCode from "@repo/client/lex/me/subsco/admin/deleteInviteCode";
import grantAdmin from "@repo/client/lex/me/subsco/admin/grantAdmin";
import unbanActor from "@repo/client/lex/me/subsco/admin/unbanActor";

import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";

export interface IAdminCommand {
  banSubscriber: (did: string, target: DidString) => Promise<void>;
  grantAdmin: (did: string, target: DidString) => Promise<void>;
  unbanActor: (did: string, target: DidString) => Promise<void>;
  createInviteCode: (did: string) => Promise<CreateInviteCodeOutput>;
  deleteInviteCode: (did: string, code: string) => Promise<void>;
}

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
    async banSubscriber(did, target) {
      const agent = await restore(did);
      await agent.call(banSubscriber, { did: target });
    },
    async grantAdmin(did, target) {
      const agent = await restore(did);
      await agent.call(grantAdmin, { did: target });
    },
    async unbanActor(did, target) {
      const agent = await restore(did);
      await agent.call(unbanActor, { did: target });
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

import { XrpcResponseError } from "@atproto/lex";
import registerAdmin from "@repo/client/me/subsco/admin/registerAdmin";
import registerAccount from "@repo/client/me/subsco/sync/registerAccount";

import type { IOAuthClient } from "@/app/server/application/interfaces/oauth-client";
import type { ISubscopeCommand } from "@/app/server/application/interfaces/subscope-command";

export const subscopeCommandFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): ISubscopeCommand => {
  const restore = async (did: string) => {
    const agent = await oauthClient.restore(did);
    if (!agent) {
      throw new Error(`OAuth session not found: ${did}`);
    }
    return agent;
  };

  return {
    async registerAdmin(did) {
      await (await restore(did)).call(registerAdmin);
    },
    async subscribe(did, inviteCode) {
      try {
        await (await restore(did)).call(registerAccount, { inviteCode });
        return "registered";
      } catch (e) {
        if (e instanceof XrpcResponseError) {
          switch (e.error) {
            case "InvalidInviteCode":
              return "invalidInviteCode";
            case "AlreadyRegistered":
              return "registered";
          }
        }
        return "failed";
      }
    },
  };
};

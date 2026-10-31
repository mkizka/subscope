import { XrpcResponseError } from "@atproto/lex";
import registerAdmin from "@repo/client/lex/me/subsco/admin/registerAdmin";
import subscribeServer from "@repo/client/lex/me/subsco/sync/subscribeServer";

import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";

export type SubscribeResult = "subscribed" | "invalidInviteCode" | "failed";

export interface ISubscopeCommand {
  registerAdmin: (did: string) => Promise<void>;
  subscribe: (did: string, inviteCode: string) => Promise<SubscribeResult>;
}

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
  };
};

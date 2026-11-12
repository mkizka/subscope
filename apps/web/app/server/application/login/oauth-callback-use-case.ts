import type { ILoggerManager } from "@repo/common/interface";

import type { IOAuthClient } from "@/app/server/application/interfaces/oauth-client";
import type { ISubscopeCommand } from "@/app/server/application/interfaces/subscope-command";
import type { ISubscopeQuery } from "@/app/server/application/interfaces/subscope-query";

type OAuthCallbackResult =
  | { did: string; invalidInviteCode: boolean }
  | {
      error:
        | "oauth_callback_failed"
        | "setup_status_check_failed"
        | "admin_registration_failed"
        | "registration_failed";
    };

export interface IOAuthCallbackUseCase {
  execute: (params: URLSearchParams) => Promise<OAuthCallbackResult>;
}

export const oauthCallbackUseCaseFactory = ({
  oauthClient,
  subscopeQuery,
  subscopeCommand,
  loggerManager,
}: {
  oauthClient: IOAuthClient;
  subscopeQuery: ISubscopeQuery;
  subscopeCommand: ISubscopeCommand;
  loggerManager: ILoggerManager;
}): IOAuthCallbackUseCase => {
  const logger = loggerManager.createLogger("oauthCallbackUseCase");
  return {
    async execute(params) {
      let did;
      let inviteCode;
      try {
        const { client, state } = await oauthClient.callback(params);
        did = client.assertDid;
        inviteCode = state;
      } catch (e) {
        logger.error(e, "OAuth callback failed");
        return { error: "oauth_callback_failed" };
      }

      let initialized;
      try {
        initialized = await subscopeQuery.isInitialized();
      } catch (e) {
        logger.error(e, "Failed to check server setup status");
        return { error: "setup_status_check_failed" };
      }

      try {
        if (!initialized) {
          await subscopeCommand.registerAdmin(did);
        }
      } catch (e) {
        logger.error(e, "Admin registration failed");
        return { error: "admin_registration_failed" };
      }

      if (initialized && inviteCode) {
        const result = await subscopeCommand.subscribe(did, inviteCode);
        if (result === "failed") {
          return { error: "registration_failed" };
        }
        return { did, invalidInviteCode: result === "invalidInviteCode" };
      }

      return { did, invalidInviteCode: false };
    },
  };
};

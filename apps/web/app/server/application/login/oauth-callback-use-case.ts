import type { ILoggerManager } from "@repo/common/domain";

import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";
import type { ISubscopeCommand } from "@/app/server/infrastructure/subscope/subscope-command";
import type { ISubscopeQuery } from "@/app/server/infrastructure/subscope/subscope-query";

type OAuthCallbackResult =
  | { did: string }
  | {
      error:
        | "oauth_callback_failed"
        | "setup_status_check_failed"
        | "admin_registration_failed";
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
      try {
        did = (await oauthClient.callback(params)).assertDid;
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

      return { did };
    },
  };
};

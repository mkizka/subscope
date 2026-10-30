import type { ILoggerManager } from "@repo/common/domain";

import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";
import type { ISubscopeRepository } from "@/app/server/infrastructure/subscope/subscope-repository";

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
  subscopeRepository,
  loggerManager,
}: {
  oauthClient: IOAuthClient;
  subscopeRepository: ISubscopeRepository;
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
        initialized = await subscopeRepository.isInitialized();
      } catch (e) {
        logger.error(e, "Failed to check server setup status");
        return { error: "setup_status_check_failed" };
      }

      try {
        if (!initialized) {
          await subscopeRepository.registerAdmin(did);
        }
      } catch (e) {
        logger.error(e, "Admin registration failed");
        return { error: "admin_registration_failed" };
      }

      return { did };
    },
  };
};

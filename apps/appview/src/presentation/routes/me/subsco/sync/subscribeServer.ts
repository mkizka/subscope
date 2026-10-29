import { asDid } from "@atproto/did";
import { type LexRouter, LexServerError } from "@atproto/lex-server";
import subscribeServer from "@repo/client/lex/me/subsco/sync/subscribeServer";

import {
  AlreadySubscribedError,
  InvalidInviteCodeError,
  type SubscribeServerUseCase,
} from "../../../../../application/use-cases/sync/subscribe-server-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class SubscribeServer {
  constructor(
    private subscribeServerUseCase: SubscribeServerUseCase,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}
  static inject = ["subscribeServerUseCase", "authVerifierMiddleware"] as const;

  handle(router: LexRouter) {
    router.add(subscribeServer, {
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx),
      handler: async ({ input, credentials }) => {
        try {
          await this.subscribeServerUseCase.execute({
            code: input.body.inviteCode,
            actorDid: asDid(credentials.did),
          });

          return {
            body: {
              success: true,
              message: "Successfully subscribed to the server",
            },
          };
        } catch (error) {
          if (
            error instanceof InvalidInviteCodeError ||
            error instanceof AlreadySubscribedError
          ) {
            throw new LexServerError(400, {
              error: error.name,
              message: error.message,
            });
          }
          throw error;
        }
      },
    });
  }
}

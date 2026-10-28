import { asDid } from "@atproto/did";
import { type LexRouter, LexServerError } from "@atproto/lex-server";
import unsubscribeServer from "@repo/client/lex/me/subsco/sync/unsubscribeServer";

import {
  NotSubscribedError,
  type UnsubscribeServerUseCase,
} from "../../../../../application/use-cases/sync/unsubscribe-server-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class UnsubscribeServer {
  constructor(
    private unsubscribeServerUseCase: UnsubscribeServerUseCase,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}
  static inject = [
    "unsubscribeServerUseCase",
    "authVerifierMiddleware",
  ] as const;

  handle(router: LexRouter) {
    router.add(unsubscribeServer, {
      auth: (ctx) => this.authVerifierMiddleware.lexLoginRequired(ctx),
      handler: async ({ credentials }) => {
        try {
          await this.unsubscribeServerUseCase.execute({
            actorDid: asDid(credentials.did),
          });

          return {
            body: {
              success: true,
              message: "Successfully unsubscribed from the server",
            },
          };
        } catch (error) {
          if (error instanceof NotSubscribedError) {
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

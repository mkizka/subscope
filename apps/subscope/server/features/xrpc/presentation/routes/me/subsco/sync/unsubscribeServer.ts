import { asDid } from "@atproto/did";
import { InvalidRequestError } from "@atproto/xrpc-server";
import type { Server } from "@repo/client/server";

import {
  NotSubscribedError,
  type UnsubscribeServerUseCase,
} from "@/server/features/xrpc/application/use-cases/sync/unsubscribe-server-use-case";
import type { AuthVerifierMiddleware } from "@/server/features/xrpc/presentation/middleware/auth-verifier-middleware";

export class UnsubscribeServer {
  constructor(
    private unsubscribeServerUseCase: UnsubscribeServerUseCase,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}
  static inject = [
    "unsubscribeServerUseCase",
    "authVerifierMiddleware",
  ] as const;

  handle(server: Server) {
    server.me.subsco.sync.unsubscribeServer({
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx.req),
      handler: async ({ auth }) => {
        try {
          await this.unsubscribeServerUseCase.execute({
            actorDid: asDid(auth.credentials.did),
          });

          return {
            encoding: "application/json",
            body: {
              success: true,
              message: "Successfully unsubscribed from the server",
            },
          };
        } catch (error) {
          if (error instanceof NotSubscribedError) {
            throw new InvalidRequestError(error.message, error.name);
          }
          throw error;
        }
      },
    });
  }
}

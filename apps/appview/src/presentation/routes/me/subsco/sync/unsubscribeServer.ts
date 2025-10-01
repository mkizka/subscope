import { asDid } from "@atproto/did";
import { InvalidRequestError } from "@atproto/xrpc-server";
import type { Server } from "@repo/client/server";

import {
  NotSubscribedError,
  type UnsubscribeServerUseCase,
} from "../../../../../application/unsubscribe-server-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../middleware/auth-verifier-middleware.js";

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

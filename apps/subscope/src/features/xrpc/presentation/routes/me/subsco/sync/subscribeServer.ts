import { asDid } from "@atproto/did";
import { InvalidRequestError } from "@atproto/xrpc-server";
import type { Server } from "@repo/client/server";

import {
  AlreadySubscribedError,
  InvalidInviteCodeError,
  type SubscribeServerUseCase,
} from "../../../../../application/use-cases/sync/subscribe-server-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../middleware/auth-verifier-middleware.js";

export class SubscribeServer {
  constructor(
    private subscribeServerUseCase: SubscribeServerUseCase,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}
  static inject = ["subscribeServerUseCase", "authVerifierMiddleware"] as const;

  handle(server: Server) {
    server.me.subsco.sync.subscribeServer({
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx.req),
      handler: async ({ input, auth }) => {
        try {
          await this.subscribeServerUseCase.execute({
            code: input.body.inviteCode,
            actorDid: asDid(auth.credentials.did),
          });

          return {
            encoding: "application/json",
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
            throw new InvalidRequestError(error.message, error.name);
          }
          throw error;
        }
      },
    });
  }
}

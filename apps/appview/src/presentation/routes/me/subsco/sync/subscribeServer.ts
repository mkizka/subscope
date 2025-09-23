import { asDid } from "@atproto/did";
import type { Server } from "@repo/client/server";

import {
  AlreadySubscribedError,
  InvalidInviteCodeError,
  type SubscribeServerUseCase,
} from "../../../../../application/subscribe-server-use-case.js";
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
            inviteCode: input.body.inviteCode,
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
          if (error instanceof InvalidInviteCodeError) {
            return {
              status: 400,
              body: {
                error: "InvalidInviteCode",
                message: error.message,
              },
            };
          }
          if (error instanceof AlreadySubscribedError) {
            return {
              status: 400,
              body: {
                error: "AlreadySubscribed",
                message: error.message,
              },
            };
          }
          throw error;
        }
      },
    });
  }
}

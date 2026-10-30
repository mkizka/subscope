import { isDid } from "@atproto/did";
import { type LexRouter, LexServerError } from "@atproto/lex-server";
import getProfile from "@repo/client/lex/app/bsky/actor/getProfile";
import { isHandle } from "@repo/common/utils";

import {
  AccountHiddenError,
  type GetProfileUseCase,
} from "../../../../../application/use-cases/actor/get-profile-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";
import type { HandleMiddleware } from "../../../../../presentation/middleware/handle-middleware.js";

export class GetProfile {
  constructor(
    private getProfileUseCase: GetProfileUseCase,
    private handleMiddleware: HandleMiddleware,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getProfile, {
      auth: (ctx) => this.authVerifierMiddleware.optionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        if (!isDid(params.actor) && !isHandle(params.actor)) {
          throw new LexServerError(400, {
            error: "InvalidRequest",
            message: "Invalid actor",
          });
        }

        const did = await this.handleMiddleware.resolveHandleOrDid(
          params.actor,
        );

        const profile = await this.getProfileUseCase
          .execute(did, viewerDid)
          .catch((error: unknown) => {
            if (error instanceof AccountHiddenError) {
              throw new LexServerError(400, {
                error: error.name,
                message: error.message,
              });
            }
            throw error;
          });
        if (!profile) {
          throw new LexServerError(400, {
            error: "InvalidRequest",
            message: "Profile not found",
          });
        }

        return {
          body: profile,
        };
      },
    });
  }
}

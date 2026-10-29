import { isDid } from "@atproto/did";
import { type LexRouter, LexServerError } from "@atproto/lex-server";
import getProfile from "@repo/client/lex/app/bsky/actor/getProfile";
import { isHandle } from "@repo/common/utils";

import type { GetProfilesUseCase } from "../../../../../application/use-cases/actor/get-profiles-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";
import type { HandleMiddleware } from "../../../../../presentation/middleware/handle-middleware.js";

export class GetProfile {
  constructor(
    private getProfilesUseCase: GetProfilesUseCase,
    private handleMiddleware: HandleMiddleware,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}
  static inject = [
    "getProfilesUseCase",
    "handleMiddleware",
    "authVerifierMiddleware",
  ] as const;

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

        const [profile] = await this.getProfilesUseCase.execute(
          [did],
          viewerDid,
        );
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

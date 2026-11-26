import { isDid } from "@atproto/did";
import { type LexRouter, LexServerError } from "@atproto/lex-server";
import getProfile from "@repo/client/app/bsky/actor/getProfile";
import { isHandle } from "@repo/common/utils";

import {
  AccountHiddenError,
  type GetProfileUseCase,
} from "../../../../../application/use-cases/actor/get-profile-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";
import type { HandleMiddleware } from "../../../../../presentation/middleware/handle-middleware.js";
import type { RepoRevMiddleware } from "../../../../../presentation/middleware/repo-rev-middleware.js";

export class GetProfile {
  constructor(
    private readonly deps: {
      getProfileUseCase: GetProfileUseCase;
      handleMiddleware: HandleMiddleware;
      authVerifierMiddleware: AuthVerifierMiddleware;
      repoRevMiddleware: RepoRevMiddleware;
    },
  ) {}

  handle(router: LexRouter) {
    router.add(getProfile, {
      auth: (ctx) => this.deps.authVerifierMiddleware.optionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        if (!isDid(params.actor) && !isHandle(params.actor)) {
          throw new LexServerError(400, {
            error: "InvalidRequest",
            message: "Invalid account",
          });
        }

        const did = await this.deps.handleMiddleware.resolveHandleOrDid(
          params.actor,
        );

        const profile = await this.deps.getProfileUseCase
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
          headers: await this.deps.repoRevMiddleware.headers(viewerDid),
          body: profile,
        };
      },
    });
  }
}

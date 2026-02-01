import { isDid } from "@atproto/did";
import { InvalidRequestError } from "@atproto/xrpc-server";
import type { Server } from "@repo/client/server";
import { isHandle } from "@repo/common/utils";

import type { GetProfilesUseCase } from "@/server/features/xrpc/application/use-cases/actor/get-profiles-use-case.js";
import type { AuthVerifierMiddleware } from "@/server/features/xrpc/presentation/middleware/auth-verifier-middleware.js";
import type { HandleMiddleware } from "@/server/features/xrpc/presentation/middleware/handle-middleware.js";

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

  handle(server: Server) {
    server.app.bsky.actor.getProfile({
      handler: async ({ params, req }) => {
        if (!isDid(params.actor) && !isHandle(params.actor)) {
          throw new InvalidRequestError("Invalid actor");
        }

        const [did, viewerDid] = await Promise.all([
          this.handleMiddleware.resolveHandleOrDid(params.actor),
          this.authVerifierMiddleware.getViewerDid(req),
        ]);

        const [profile] = await this.getProfilesUseCase.execute(
          [did],
          viewerDid,
        );
        if (!profile) {
          throw new InvalidRequestError("Profile not found");
        }

        return {
          encoding: "application/json",
          body: profile,
        };
      },
    });
  }
}

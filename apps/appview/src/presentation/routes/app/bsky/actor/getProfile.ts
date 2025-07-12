import { isDid } from "@atproto/did";
import { InvalidRequestError } from "@atproto/xrpc-server";
import type { Server } from "@repo/client/server";
import { isHandle } from "@repo/common/utils";

import type { AuthVerifierService } from "../../../../../application/service/request/auth-verifier-service.js";
import type { HandleService } from "../../../../../application/service/request/handle-service.js";
import type { GetProfilesUseCase } from "../../../../../application/use-cases/actor/get-profiles-use-case.js";

export class GetProfile {
  constructor(
    private getProfilesUseCase: GetProfilesUseCase,
    private handleService: HandleService,
    private authVerifierService: AuthVerifierService,
  ) {}
  static inject = [
    "getProfilesUseCase",
    "handleService",
    "authVerifierService",
  ] as const;

  handle(server: Server) {
    server.app.bsky.actor.getProfile({
      handler: async ({ params, req }) => {
        if (!isDid(params.actor) && !isHandle(params.actor)) {
          throw new InvalidRequestError("Invalid actor");
        }

        const [did, viewerDid] = await Promise.all([
          this.handleService.resolveHandleOrDid(params.actor),
          this.authVerifierService.getViewerDid(req),
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

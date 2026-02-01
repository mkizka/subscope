import { isDid } from "@atproto/did";
import type { Server } from "@repo/client/server";
import { isHandle } from "@repo/common/utils";

import type { GetProfilesUseCase } from "@/server/features/xrpc/application/use-cases/actor/get-profiles-use-case.js";
import type { HandleMiddleware } from "@/server/features/xrpc/presentation/middleware/handle-middleware.js";

export class GetProfiles {
  constructor(
    private getProfilesUseCase: GetProfilesUseCase,
    private handleMiddleware: HandleMiddleware,
  ) {}
  static inject = ["getProfilesUseCase", "handleMiddleware"] as const;

  handle(server: Server) {
    server.app.bsky.actor.getProfiles({
      handler: async ({ params }) => {
        const handleOrDids = params.actors.filter(
          (actor) => isDid(actor) || isHandle(actor),
        );
        const dids =
          await this.handleMiddleware.resolveHandleOrDids(handleOrDids);
        const profiles = await this.getProfilesUseCase.execute(dids);
        return {
          encoding: "application/json",
          body: { profiles },
        };
      },
    });
  }
}

import { isDid } from "@atproto/did";
import type { LexRouter } from "@atproto/lex-server";
import getProfiles from "@repo/client/lex/app/bsky/actor/getProfiles";
import { isHandle } from "@repo/common/utils";

import type { GetProfilesUseCase } from "../../../../../application/use-cases/actor/get-profiles-use-case.js";
import type { HandleMiddleware } from "../../../../../presentation/middleware/handle-middleware.js";

export class GetProfiles {
  constructor(
    private getProfilesUseCase: GetProfilesUseCase,
    private handleMiddleware: HandleMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getProfiles, async ({ params }) => {
      const handleOrDids = params.actors.filter(
        (actor) => isDid(actor) || isHandle(actor),
      );
      const dids =
        await this.handleMiddleware.resolveHandleOrDids(handleOrDids);
      const profiles = await this.getProfilesUseCase.execute(dids);
      return {
        body: { profiles },
      };
    });
  }
}

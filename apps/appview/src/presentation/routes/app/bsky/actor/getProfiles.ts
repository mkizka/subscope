import { isDid } from "@atproto/did";
import type { LexRouter } from "@atproto/lex-server";
import getProfiles from "@repo/client/app/bsky/actor/getProfiles";
import { isHandle } from "@repo/common/utils";

import type { GetProfilesUseCase } from "../../../../../application/use-cases/actor/get-profiles-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";
import type { HandleMiddleware } from "../../../../../presentation/middleware/handle-middleware.js";
import type { RepoRevMiddleware } from "../../../../../presentation/middleware/repo-rev-middleware.js";

export class GetProfiles {
  constructor(
    private getProfilesUseCase: GetProfilesUseCase,
    private handleMiddleware: HandleMiddleware,
    private authVerifierMiddleware: AuthVerifierMiddleware,
    private repoRevMiddleware: RepoRevMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getProfiles, {
      auth: (ctx) => this.authVerifierMiddleware.optionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        const handleOrDids = params.actors.filter(
          (account) => isDid(account) || isHandle(account),
        );
        const dids =
          await this.handleMiddleware.resolveHandleOrDids(handleOrDids);
        const profiles = await this.getProfilesUseCase.execute(dids, viewerDid);
        return {
          headers: await this.repoRevMiddleware.headers(viewerDid),
          body: { profiles },
        };
      },
    });
  }
}

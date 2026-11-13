import type { LexRouter } from "@atproto/lex-server";
import getRepostedBy from "@repo/client/app/bsky/feed/getRepostedBy";

import type { GetRepostedByUseCase } from "../../../../../application/use-cases/feed/get-reposted-by-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../middleware/auth-verifier-middleware.js";

export class GetRepostedBy {
  constructor(
    private getRepostedByUseCase: GetRepostedByUseCase,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getRepostedBy, {
      auth: (ctx) => this.authVerifierMiddleware.optionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        const result = await this.getRepostedByUseCase.execute(params, {
          viewerDid,
        });
        return { body: result };
      },
    });
  }
}

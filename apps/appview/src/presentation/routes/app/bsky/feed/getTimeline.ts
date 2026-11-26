import type { LexRouter } from "@atproto/lex-server";
import getTimeline from "@repo/client/app/bsky/feed/getTimeline";

import type { GetTimelineUseCase } from "../../../../../application/use-cases/feed/get-timeline-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";
import type { RepoRevMiddleware } from "../../../../../presentation/middleware/repo-rev-middleware.js";

export class GetTimeline {
  constructor(
    private readonly deps: {
      authVerifierMiddleware: AuthVerifierMiddleware;
      getTimelineUseCase: GetTimelineUseCase;
      repoRevMiddleware: RepoRevMiddleware;
    },
  ) {}

  handle(router: LexRouter) {
    router.add(getTimeline, {
      auth: (ctx) => this.deps.authVerifierMiddleware.loginRequired(ctx),
      handler: async ({ params, credentials }) => {
        const body = await this.deps.getTimelineUseCase.execute({
          algorithm: params.algorithm,
          limit: params.limit,
          cursor: params.cursor,
          viewerDid: credentials.did,
        });
        return {
          headers: await this.deps.repoRevMiddleware.headers(credentials.did),
          body,
        };
      },
    });
  }
}

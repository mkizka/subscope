import type { LexRouter } from "@atproto/lex-server";
import getTimeline from "@repo/client/lex/app/bsky/feed/getTimeline";

import type { GetTimelineUseCase } from "../../../../../application/use-cases/feed/get-timeline-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class GetTimeline {
  constructor(
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
    private readonly getTimelineUseCase: GetTimelineUseCase,
  ) {}
  static inject = ["authVerifierMiddleware", "getTimelineUseCase"] as const;

  handle(router: LexRouter) {
    router.add(getTimeline, {
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx),
      handler: async ({ params, credentials }) => {
        const body = await this.getTimelineUseCase.execute({
          algorithm: params.algorithm,
          limit: params.limit,
          cursor: params.cursor,
          viewerDid: credentials.did,
        });
        return { body };
      },
    });
  }
}

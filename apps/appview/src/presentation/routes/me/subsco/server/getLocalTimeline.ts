import type { LexRouter } from "@atproto/lex-server";
import getLocalTimeline from "@repo/client/me/subsco/server/getLocalTimeline";

import type { GetLocalTimelineUseCase } from "../../../../../application/use-cases/feed/get-local-timeline-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class GetLocalTimeline {
  constructor(
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
    private readonly getLocalTimelineUseCase: GetLocalTimelineUseCase,
  ) {}

  handle(router: LexRouter) {
    router.add(getLocalTimeline, {
      auth: (ctx) => this.authVerifierMiddleware.optionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        const body = await this.getLocalTimelineUseCase.execute({
          limit: params.limit,
          cursor: params.cursor,
          viewerDid: viewerDid ?? undefined,
        });
        return { body };
      },
    });
  }
}

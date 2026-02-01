import type { Server } from "@repo/client/server";

import type { GetTimelineUseCase } from "@/server/features/xrpc/application/use-cases/feed/get-timeline-use-case.js";
import type { AuthVerifierMiddleware } from "@/server/features/xrpc/presentation/middleware/auth-verifier-middleware.js";

export class GetTimeline {
  constructor(
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
    private readonly getTimelineUseCase: GetTimelineUseCase,
  ) {}
  static inject = ["authVerifierMiddleware", "getTimelineUseCase"] as const;

  handle(server: Server) {
    server.app.bsky.feed.getTimeline({
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx.req),
      handler: async ({ params, auth }) => {
        const timeline = await this.getTimelineUseCase.execute({
          algorithm: params.algorithm,
          limit: params.limit,
          cursor: params.cursor,
          viewerDid: auth.credentials.did,
        });
        return {
          encoding: "application/json",
          body: timeline,
        };
      },
    });
  }
}

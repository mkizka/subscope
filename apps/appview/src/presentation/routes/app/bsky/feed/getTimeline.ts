import type { Server } from "@repo/client/server";

import type { AuthVerifierService } from "../../../../../application/service/request/auth-verifier-service.js";
import type { GetTimelineUseCase } from "../../../../../application/use-cases/feed/get-timeline-use-case.js";

export class GetTimeline {
  constructor(
    private readonly authVerifierService: AuthVerifierService,
    private readonly getTimelineUseCase: GetTimelineUseCase,
  ) {}
  static inject = ["authVerifierService", "getTimelineUseCase"] as const;

  handle(server: Server) {
    server.app.bsky.feed.getTimeline({
      auth: (ctx) => this.authVerifierService.loginRequired(ctx.req),
      handler: async ({ params, auth }) => {
        const timeline = await this.getTimelineUseCase.execute(
          params,
          auth.credentials.did,
        );
        return {
          encoding: "application/json",
          body: timeline,
        };
      },
    });
  }
}

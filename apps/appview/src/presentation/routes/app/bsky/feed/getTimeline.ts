import type { Server } from "@repo/client/server";

import type { GetTimelineUseCase } from "../../../../../application/get-timeline-use-case.js";
import type { AuthVerifierService } from "../../../../../application/service/auth-verifier-service.js";

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
        // TODO: authを使ってユーザーのフォローしている投稿だけを返す
        const timeline = await this.getTimelineUseCase.execute(params);
        return {
          encoding: "application/json",
          body: timeline,
        };
      },
    });
  }
}

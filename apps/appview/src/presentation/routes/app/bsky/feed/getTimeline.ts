import type { Server } from "@dawn/client";

import type { GetTimelineUseCase } from "../../../../../application/get-timeline-use-case.js";

export class GetTimeline {
  constructor(private readonly getTimelineUseCase: GetTimelineUseCase) {}
  static inject = ["findTimelineUseCase"] as const;

  handle(server: Server) {
    server.app.bsky.feed.getTimeline({
      handler: async () => {
        const timeline = await this.getTimelineUseCase.execute();
        return {
          encoding: "application/json",
          body: timeline,
        };
      },
    });
  }
}

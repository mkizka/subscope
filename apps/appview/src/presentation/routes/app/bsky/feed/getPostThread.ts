import type { Server } from "@repo/client/server";

import type { GetPostThreadUseCase } from "../../../../../application/get-post-thread-use-case.js";

export class GetPostThread {
  constructor(private readonly getPostThreadUseCase: GetPostThreadUseCase) {}
  static inject = ["getPostThreadUseCase"] as const;

  handle(server: Server) {
    server.app.bsky.feed.getPostThread({
      handler: async ({ params }) => {
        const result = await this.getPostThreadUseCase.execute(params);
        return {
          encoding: "application/json",
          body: result,
        };
      },
    });
  }
}

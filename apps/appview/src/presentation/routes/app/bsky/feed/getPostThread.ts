import { AtUri } from "@atproto/syntax";
import type { Server } from "@repo/client/server";

import type { GetPostThreadUseCase } from "../../../../../application/get-post-thread-use-case.js";

export class GetPostThread {
  constructor(private readonly getPostThreadUseCase: GetPostThreadUseCase) {}
  static inject = ["getPostThreadUseCase"] as const;

  handle(server: Server) {
    server.app.bsky.feed.getPostThread({
      handler: async ({ params }) => {
        const { thread } = await this.getPostThreadUseCase.execute({
          uri: new AtUri(params.uri),
          depth: params.depth,
          parentHeight: params.parentHeight,
        });
        return {
          encoding: "application/json",
          body: { thread },
        };
      },
    });
  }
}

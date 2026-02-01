import { AtUri } from "@atproto/syntax";
import type { Server } from "@repo/client/server";

import type { GetFeedGeneratorsUseCase } from "@/server/features/xrpc/application/use-cases/feed/get-feed-generators-use-case.js";

export class GetFeedGenerators {
  constructor(
    private readonly getFeedGeneratorsUseCase: GetFeedGeneratorsUseCase,
  ) {}
  static inject = ["getFeedGeneratorsUseCase"] as const;

  handle(server: Server) {
    server.app.bsky.feed.getFeedGenerators({
      handler: async ({ params }) => {
        const feeds = await this.getFeedGeneratorsUseCase.execute(
          params.feeds.map((uri) => new AtUri(uri)),
        );
        return {
          encoding: "application/json",
          body: { feeds },
        };
      },
    });
  }
}

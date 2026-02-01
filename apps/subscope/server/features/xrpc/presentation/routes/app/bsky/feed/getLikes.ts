import type { Server } from "@repo/client/server";

import type { GetLikesUseCase } from "@/server/features/xrpc/application/use-cases/feed/get-likes-use-case.js";

export class GetLikes {
  constructor(private getLikesUseCase: GetLikesUseCase) {}
  static inject = ["getLikesUseCase"] as const;

  handle(server: Server) {
    server.app.bsky.feed.getLikes({
      handler: async ({ params }) => {
        const result = await this.getLikesUseCase.execute({
          uri: params.uri,
          cid: params.cid,
          limit: params.limit,
          cursor: params.cursor,
        });
        return {
          encoding: "application/json",
          body: result,
        };
      },
    });
  }
}

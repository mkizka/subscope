import type { Server } from "@repo/client/server";
import type { DatabaseClient } from "@repo/common/domain";

import type { GetLikesUseCase } from "../../../../../application/use-cases/feed/get-likes-use-case.js";

export class GetLikes {
  constructor(
    private getLikesUseCase: GetLikesUseCase,
    private db: DatabaseClient,
  ) {}
  static inject = ["getLikesUseCase", "db"] as const;

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

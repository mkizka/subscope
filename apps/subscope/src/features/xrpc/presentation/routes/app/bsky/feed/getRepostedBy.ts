import type { Server } from "@repo/client/server";

import type { GetRepostedByUseCase } from "../../../../../application/use-cases/feed/get-reposted-by-use-case.js";

export class GetRepostedBy {
  constructor(private getRepostedByUseCase: GetRepostedByUseCase) {}
  static inject = ["getRepostedByUseCase", "db"] as const;

  handle(server: Server) {
    server.app.bsky.feed.getRepostedBy({
      handler: async ({ params }) => {
        const result = await this.getRepostedByUseCase.execute({
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

import { isDid } from "@atproto/did";
import type { Server } from "@repo/client/server";
import { isHandle } from "@repo/common/utils";

import type { GetFollowersUseCase } from "../../../../../application/use-cases/graph/get-followers-use-case.js";
import type { HandleMiddleware } from "../../../../middleware/handle-middleware.js";

export class GetFollowers {
  constructor(
    private getFollowersUseCase: GetFollowersUseCase,
    private handleMiddleware: HandleMiddleware,
  ) {}
  static inject = ["getFollowersUseCase", "handleMiddleware"] as const;

  handle(server: Server) {
    server.app.bsky.graph.getFollowers({
      handler: async ({ params }) => {
        if (!isDid(params.actor) && !isHandle(params.actor)) {
          return {
            status: 400,
            message: "Invalid actor",
          };
        }

        const actorDid = await this.handleMiddleware.resolveHandleOrDid(
          params.actor,
        );

        const result = await this.getFollowersUseCase.execute({
          actorDid,
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

import { isDid } from "@atproto/did";
import type { Server } from "@repo/client/server";
import { isHandle } from "@repo/common/utils";

import type { GetFollowsUseCase } from "../../../../../application/use-cases/graph/get-follows-use-case.js";
import type { HandleMiddleware } from "../../../../middleware/handle-middleware.js";

export class GetFollows {
  constructor(
    private getFollowsUseCase: GetFollowsUseCase,
    private handleMiddleware: HandleMiddleware,
  ) {}
  static inject = ["getFollowsUseCase", "handleMiddleware"] as const;

  handle(server: Server) {
    server.app.bsky.graph.getFollows({
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

        const result = await this.getFollowsUseCase.execute({
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

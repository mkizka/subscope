import { isDid } from "@atproto/did";
import type { Server } from "@repo/client/server";
import { isHandle } from "@repo/common/utils";

import type { HandleService } from "../../../../../application/service/request/handle-service.js";
import type { GetFollowsUseCase } from "../../../../../application/use-cases/graph/get-follows-use-case.js";

export class GetFollows {
  constructor(
    private getFollowsUseCase: GetFollowsUseCase,
    private handleService: HandleService,
  ) {}
  static inject = ["getFollowsUseCase", "handleService"] as const;

  handle(server: Server) {
    server.app.bsky.graph.getFollows({
      handler: async ({ params }) => {
        if (!isDid(params.actor) && !isHandle(params.actor)) {
          return {
            status: 400,
            message: "Invalid actor",
          };
        }

        const actorDid = await this.handleService.resolveHandleOrDid(
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

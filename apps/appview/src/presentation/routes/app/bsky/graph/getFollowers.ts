import { isDid } from "@atproto/did";
import type { Server } from "@repo/client/server";
import { isHandle } from "@repo/common/utils";

import type { HandleService } from "../../../../../application/service/request/handle-service.js";
import type { GetFollowersUseCase } from "../../../../../application/use-cases/graph/get-followers-use-case.js";

export class GetFollowers {
  constructor(
    private getFollowersUseCase: GetFollowersUseCase,
    private handleService: HandleService,
  ) {}
  static inject = ["getFollowersUseCase", "handleService"] as const;

  handle(server: Server) {
    server.app.bsky.graph.getFollowers({
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

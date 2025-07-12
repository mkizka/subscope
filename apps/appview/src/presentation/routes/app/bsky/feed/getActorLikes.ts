import { isDid } from "@atproto/did";
import type { Server } from "@repo/client/server";
import { isHandle } from "@repo/common/utils";

import type { GetActorLikesUseCase } from "../../../../../application/use-cases/feed/get-actor-likes-use-case.js";
import type { HandleMiddleware } from "../../../../middleware/handle-middleware.js";

export class GetActorLikes {
  constructor(
    private getActorLikesUseCase: GetActorLikesUseCase,
    private handleMiddleware: HandleMiddleware,
  ) {}
  static inject = ["getActorLikesUseCase", "handleMiddleware"] as const;

  handle(server: Server) {
    server.app.bsky.feed.getActorLikes({
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

        const result = await this.getActorLikesUseCase.execute({
          actorDid,
          limit: params.limit,
          cursor: params.cursor ? new Date(params.cursor) : undefined,
        });

        return {
          encoding: "application/json",
          body: result,
        };
      },
    });
  }
}

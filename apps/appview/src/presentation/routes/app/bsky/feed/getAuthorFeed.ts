import { isDid } from "@atproto/did";
import type { Server } from "@repo/client/server";
import { isHandle } from "@repo/common/utils";

import type { GetAuthorFeedUseCase } from "../../../../../application/get-author-feed-use-case.js";
import type { HandleService } from "../../../../../application/service/handle-service.js";

export class GetAuthorFeed {
  constructor(
    private getAuthorFeedUseCase: GetAuthorFeedUseCase,
    private handleService: HandleService,
  ) {}
  static inject = ["getAuthorFeedUseCase", "handleService"] as const;

  handle(server: Server) {
    server.app.bsky.feed.getAuthorFeed({
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

        const result = await this.getAuthorFeedUseCase.execute({
          actorDid,
          limit: params.limit,
          cursor: params.cursor ? new Date(params.cursor) : undefined,
          filter: params.filter,
          includePins: params.includePins,
        });

        return {
          encoding: "application/json",
          body: result,
        };
      },
    });
  }
}

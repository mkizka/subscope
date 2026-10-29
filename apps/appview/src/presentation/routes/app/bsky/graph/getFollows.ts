import type { LexRouter } from "@atproto/lex-server";
import getFollows from "@repo/client/lex/app/bsky/graph/getFollows";

import type { GetFollowsUseCase } from "../../../../../application/use-cases/graph/get-follows-use-case.js";
import type { HandleMiddleware } from "../../../../../presentation/middleware/handle-middleware.js";

export class GetFollows {
  constructor(
    private getFollowsUseCase: GetFollowsUseCase,
    private handleMiddleware: HandleMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getFollows, async ({ params }) => {
      const actorDid = await this.handleMiddleware.resolveHandleOrDid(
        params.actor,
      );

      const result = await this.getFollowsUseCase.execute({
        actorDid,
        limit: params.limit,
        cursor: params.cursor,
      });

      return {
        body: result,
      };
    });
  }
}

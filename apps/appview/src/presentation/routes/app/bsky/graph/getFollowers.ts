import type { LexRouter } from "@atproto/lex-server";
import getFollowers from "@repo/client/lex/app/bsky/graph/getFollowers";

import type { GetFollowersUseCase } from "../../../../../application/use-cases/graph/get-followers-use-case.js";
import type { HandleMiddleware } from "../../../../../presentation/middleware/handle-middleware.js";

export class GetFollowers {
  constructor(
    private getFollowersUseCase: GetFollowersUseCase,
    private handleMiddleware: HandleMiddleware,
  ) {}
  static inject = ["getFollowersUseCase", "handleMiddleware"] as const;

  handle(router: LexRouter) {
    router.add(getFollowers, async ({ params }) => {
      const actorDid = await this.handleMiddleware.resolveHandleOrDid(
        params.actor,
      );

      const result = await this.getFollowersUseCase.execute({
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

import type { LexRouter } from "@atproto/lex-server";
import getRegisteredFollowers from "@repo/client/lex/me/subsco/graph/getRegisteredFollowers";

import type { GetRegisteredFollowersUseCase } from "../../../../../application/use-cases/graph/get-registered-followers-use-case.js";
import type { HandleMiddleware } from "../../../../../presentation/middleware/handle-middleware.js";

export class GetRegisteredFollowers {
  constructor(
    private getRegisteredFollowersUseCase: GetRegisteredFollowersUseCase,
    private handleMiddleware: HandleMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getRegisteredFollowers, async ({ params }) => {
      const accountDid = await this.handleMiddleware.resolveHandleOrDid(
        params.actor,
      );

      const result = await this.getRegisteredFollowersUseCase.execute({
        accountDid,
        limit: params.limit,
        cursor: params.cursor,
      });

      return { body: result };
    });
  }
}

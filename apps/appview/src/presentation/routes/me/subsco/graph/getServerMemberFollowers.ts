import type { LexRouter } from "@atproto/lex-server";
import getServerMemberFollowers from "@repo/client/me/subsco/graph/getServerMemberFollowers";

import type { GetServerMemberFollowersUseCase } from "../../../../../application/use-cases/graph/get-server-member-followers-use-case.js";
import type { HandleMiddleware } from "../../../../../presentation/middleware/handle-middleware.js";

export class GetServerMemberFollowers {
  constructor(
    private getServerMemberFollowersUseCase: GetServerMemberFollowersUseCase,
    private handleMiddleware: HandleMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getServerMemberFollowers, async ({ params }) => {
      const accountDid = await this.handleMiddleware.resolveHandleOrDid(
        params.actor,
      );

      const result = await this.getServerMemberFollowersUseCase.execute({
        accountDid,
        limit: params.limit,
        cursor: params.cursor,
      });

      return { body: result };
    });
  }
}

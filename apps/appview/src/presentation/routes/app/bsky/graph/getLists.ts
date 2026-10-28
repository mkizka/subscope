import type { LexRouter } from "@atproto/lex-server";
import getLists from "@repo/client/lex/app/bsky/graph/getLists";

import type { GetListsUseCase } from "../../../../../application/use-cases/graph/get-lists-use-case.js";
import type { HandleMiddleware } from "../../../../../presentation/middleware/handle-middleware.js";

export class GetLists {
  constructor(
    private getListsUseCase: GetListsUseCase,
    private handleMiddleware: HandleMiddleware,
  ) {}
  static inject = ["getListsUseCase", "handleMiddleware"] as const;

  handle(router: LexRouter) {
    router.add(getLists, async ({ params }) => {
      const actorDid = await this.handleMiddleware.resolveHandleOrDid(
        params.actor,
      );

      const result = await this.getListsUseCase.execute({
        actorDid,
        limit: params.limit,
        cursor: params.cursor,
        purposes: params.purposes,
      });

      return {
        body: result,
      };
    });
  }
}

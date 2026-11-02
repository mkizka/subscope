import type { LexRouter } from "@atproto/lex-server";
import getLists from "@repo/client/lex/app/bsky/graph/getLists";

import type { GetListsUseCase } from "../../../../../application/use-cases/graph/get-lists-use-case.js";
import type { HandleMiddleware } from "../../../../../presentation/middleware/handle-middleware.js";

export class GetLists {
  constructor(
    private getListsUseCase: GetListsUseCase,
    private handleMiddleware: HandleMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getLists, async ({ params }) => {
      const accountDid = await this.handleMiddleware.resolveHandleOrDid(
        params.actor,
      );

      const result = await this.getListsUseCase.execute({
        accountDid,
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

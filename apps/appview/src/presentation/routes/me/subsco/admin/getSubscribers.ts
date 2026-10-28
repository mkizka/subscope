import type { LexRouter } from "@atproto/lex-server";
import getSubscribers from "@repo/client/lex/me/subsco/admin/getSubscribers";

import type { GetSubscribersUseCase } from "../../../../../application/use-cases/admin/get-subscribers-use-case.js";

export class GetSubscribers {
  constructor(private getSubscribersUseCase: GetSubscribersUseCase) {}
  static inject = ["getSubscribersUseCase"] as const;

  handle(router: LexRouter) {
    router.add(getSubscribers, async ({ params }) => {
      const result = await this.getSubscribersUseCase.execute({
        limit: params.limit,
        cursor: params.cursor,
      });

      return { body: result };
    });
  }
}

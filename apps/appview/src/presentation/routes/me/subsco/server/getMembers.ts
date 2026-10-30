import type { LexRouter } from "@atproto/lex-server";
import getMembers from "@repo/client/lex/me/subsco/server/getMembers";

import type { GetMembersUseCase } from "../../../../../application/use-cases/server/get-members-use-case.js";

export class GetMembers {
  constructor(private readonly getMembersUseCase: GetMembersUseCase) {}

  handle(router: LexRouter) {
    router.add(getMembers, async ({ params }) => {
      const result = await this.getMembersUseCase.execute({
        limit: params.limit,
        cursor: params.cursor,
      });
      return { body: result };
    });
  }
}

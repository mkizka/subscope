import type { LexRouter } from "@atproto/lex-server";
import getServerMembers from "@repo/client/me/subsco/server/getServerMembers";

import type { GetServerMembersUseCase } from "../../../../../application/use-cases/server/get-server-members-use-case.js";

export class GetServerMembers {
  constructor(
    private readonly getServerMembersUseCase: GetServerMembersUseCase,
  ) {}

  handle(router: LexRouter) {
    router.add(getServerMembers, async ({ params }) => {
      const result = await this.getServerMembersUseCase.execute({
        limit: params.limit,
        cursor: params.cursor,
        q: params.q,
      });
      return { body: result };
    });
  }
}

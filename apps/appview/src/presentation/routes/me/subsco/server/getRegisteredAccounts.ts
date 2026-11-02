import type { LexRouter } from "@atproto/lex-server";
import getRegisteredAccounts from "@repo/client/lex/me/subsco/server/getRegisteredAccounts";

import type { GetRegisteredAccountsUseCase } from "../../../../../application/use-cases/server/get-registered-accounts-use-case.js";

export class GetRegisteredAccounts {
  constructor(
    private readonly getRegisteredAccountsUseCase: GetRegisteredAccountsUseCase,
  ) {}

  handle(router: LexRouter) {
    router.add(getRegisteredAccounts, async ({ params }) => {
      const result = await this.getRegisteredAccountsUseCase.execute({
        limit: params.limit,
        cursor: params.cursor,
        q: params.q,
      });
      return { body: result };
    });
  }
}

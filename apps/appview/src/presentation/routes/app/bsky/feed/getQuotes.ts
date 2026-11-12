import type { LexRouter } from "@atproto/lex-server";
import getQuotes from "@repo/client/app/bsky/feed/getQuotes";

import type { GetQuotesUseCase } from "../../../../../application/use-cases/feed/get-quotes-use-case.js";

export class GetQuotes {
  constructor(private getQuotesUseCase: GetQuotesUseCase) {}

  handle(router: LexRouter) {
    router.add(getQuotes, async ({ params }) => {
      const result = await this.getQuotesUseCase.execute(params);
      return { body: result };
    });
  }
}

import type { LexRouter } from "@atproto/lex-server";
import getQuotes from "@repo/client/app/bsky/feed/getQuotes";

import type { GetQuotesUseCase } from "../../../../../application/use-cases/feed/get-quotes-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../middleware/auth-verifier-middleware.js";

export class GetQuotes {
  constructor(
    private getQuotesUseCase: GetQuotesUseCase,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getQuotes, {
      auth: (ctx) => this.authVerifierMiddleware.optionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        const result = await this.getQuotesUseCase.execute(params, {
          viewerDid,
        });
        return { body: result };
      },
    });
  }
}

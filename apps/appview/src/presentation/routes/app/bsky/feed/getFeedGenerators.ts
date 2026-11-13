import type { LexRouter } from "@atproto/lex-server";
import { AtUri } from "@atproto/syntax";
import getFeedGenerators from "@repo/client/app/bsky/feed/getFeedGenerators";

import type { GetFeedGeneratorsUseCase } from "../../../../../application/use-cases/feed/get-feed-generators-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../middleware/auth-verifier-middleware.js";

export class GetFeedGenerators {
  constructor(
    private readonly getFeedGeneratorsUseCase: GetFeedGeneratorsUseCase,
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getFeedGenerators, {
      auth: (ctx) => this.authVerifierMiddleware.optionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        const feeds = await this.getFeedGeneratorsUseCase.execute(
          params.feeds.map((uri) => new AtUri(uri)),
          { viewerDid },
        );
        return { body: { feeds } };
      },
    });
  }
}

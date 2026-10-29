import type { LexRouter } from "@atproto/lex-server";
import { AtUri } from "@atproto/syntax";
import getFeedGenerators from "@repo/client/lex/app/bsky/feed/getFeedGenerators";

import type { GetFeedGeneratorsUseCase } from "../../../../../application/use-cases/feed/get-feed-generators-use-case.js";

export class GetFeedGenerators {
  constructor(
    private readonly getFeedGeneratorsUseCase: GetFeedGeneratorsUseCase,
  ) {}

  handle(router: LexRouter) {
    router.add(getFeedGenerators, async ({ params }) => {
      const feeds = await this.getFeedGeneratorsUseCase.execute(
        params.feeds.map((uri) => new AtUri(uri)),
      );
      return {
        body: { feeds },
      };
    });
  }
}

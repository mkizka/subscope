import type { LexRouter } from "@atproto/lex-server";
import getLikes from "@repo/client/lex/app/bsky/feed/getLikes";

import type { GetLikesUseCase } from "../../../../../application/use-cases/feed/get-likes-use-case.js";

export class GetLikes {
  constructor(private getLikesUseCase: GetLikesUseCase) {}

  handle(router: LexRouter) {
    router.add(getLikes, async ({ params }) => {
      const result = await this.getLikesUseCase.execute(params);
      return { body: result };
    });
  }
}

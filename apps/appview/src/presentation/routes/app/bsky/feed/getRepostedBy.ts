import type { LexRouter } from "@atproto/lex-server";
import getRepostedBy from "@repo/client/lex/app/bsky/feed/getRepostedBy";

import type { GetRepostedByUseCase } from "../../../../../application/use-cases/feed/get-reposted-by-use-case.js";

export class GetRepostedBy {
  constructor(private getRepostedByUseCase: GetRepostedByUseCase) {}
  static inject = ["getRepostedByUseCase"] as const;

  handle(router: LexRouter) {
    router.add(getRepostedBy, async ({ params }) => {
      const result = await this.getRepostedByUseCase.execute(params);
      return { body: result };
    });
  }
}

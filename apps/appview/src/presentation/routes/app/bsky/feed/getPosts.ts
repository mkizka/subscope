import type { LexRouter } from "@atproto/lex-server";
import { AtUri } from "@atproto/syntax";
import getPosts from "@repo/client/lex/app/bsky/feed/getPosts";

import type { GetPostsUseCase } from "../../../../../application/use-cases/feed/get-posts-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";
import {
  formatLabelerHeader,
  parseLabelerHeader,
} from "../../../../labelers-header.js";

export class GetPosts {
  constructor(
    private readonly getPostsUseCase: GetPostsUseCase,
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getPosts, {
      auth: (ctx) => this.authVerifierMiddleware.optionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid, request }) => {
        const labelers = parseLabelerHeader(
          request.headers.get("atproto-accept-labelers"),
        );
        const posts = await this.getPostsUseCase.execute(
          params.uris.map((uri) => new AtUri(uri)),
          {
            viewerDid,
            labelerDids: labelers?.map(({ did }) => did),
          },
        );
        return {
          headers: labelers
            ? { "atproto-content-labelers": formatLabelerHeader(labelers) }
            : undefined,
          body: { posts },
        };
      },
    });
  }
}

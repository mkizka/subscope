import { type LexRouter, LexServerError } from "@atproto/lex-server";
import { AtUri } from "@atproto/syntax";
import getPostThread from "@repo/client/app/bsky/feed/getPostThread";

import type { AtUriService } from "../../../../../application/service/at-uri-service.js";
import { PostNotFoundError } from "../../../../../application/service/feed/post-thread-service.js";
import type { GetPostThreadUseCase } from "../../../../../application/use-cases/feed/get-post-thread-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";
import type { RepoRevMiddleware } from "../../../../../presentation/middleware/repo-rev-middleware.js";

export class GetPostThread {
  constructor(
    private readonly deps: {
      getPostThreadUseCase: GetPostThreadUseCase;
      atUriService: AtUriService;
      authVerifierMiddleware: AuthVerifierMiddleware;
      repoRevMiddleware: RepoRevMiddleware;
    },
  ) {}

  handle(router: LexRouter) {
    router.add(getPostThread, {
      auth: (ctx) => this.deps.authVerifierMiddleware.optionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        const resolvedUri = await this.deps.atUriService.resolveHostname(
          new AtUri(params.uri),
        );
        try {
          const result = await this.deps.getPostThreadUseCase.execute({
            uri: resolvedUri,
            depth: params.depth,
            parentHeight: params.parentHeight,
            // TODO: nullを渡せるようにする
            viewerDid: viewerDid || undefined,
          });
          return {
            headers: await this.deps.repoRevMiddleware.headers(viewerDid),
            body: result,
          };
        } catch (error) {
          if (error instanceof PostNotFoundError) {
            throw new LexServerError(
              400,
              { error: error.name, message: error.message },
              await this.deps.repoRevMiddleware.headers(viewerDid),
            );
          }
          throw error;
        }
      },
    });
  }
}

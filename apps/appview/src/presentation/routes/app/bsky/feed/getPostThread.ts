import { type LexRouter, LexServerError } from "@atproto/lex-server";
import { AtUri } from "@atproto/syntax";
import getPostThread from "@repo/client/lex/app/bsky/feed/getPostThread";

import {
  type GetPostThreadUseCase,
  PostNotFoundError,
} from "../../../../../application/use-cases/feed/get-post-thread-use-case.js";
import type { AtUriService } from "../../../../../domain/service/at-uri-service.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class GetPostThread {
  constructor(
    private readonly getPostThreadUseCase: GetPostThreadUseCase,
    private readonly atUriService: AtUriService,
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}
  static inject = [
    "getPostThreadUseCase",
    "atUriService",
    "authVerifierMiddleware",
  ] as const;

  handle(router: LexRouter) {
    router.add(getPostThread, {
      auth: (ctx) => this.authVerifierMiddleware.lexOptionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        const resolvedUri = await this.atUriService.resolveHostname(
          new AtUri(params.uri),
        );
        try {
          const result = await this.getPostThreadUseCase.execute({
            uri: resolvedUri,
            depth: params.depth,
            parentHeight: params.parentHeight,
            // TODO: nullを渡せるようにする
            viewerDid: viewerDid || undefined,
          });
          return {
            body: result,
          };
        } catch (error) {
          if (error instanceof PostNotFoundError) {
            throw new LexServerError(400, {
              error: error.name,
              message: error.message,
            });
          }
          throw error;
        }
      },
    });
  }
}

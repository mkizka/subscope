import type { LexRouter } from "@atproto/lex-server";
import { AtUri } from "@atproto/syntax";
import getPostThreadV2 from "@repo/client/lex/app/bsky/unspecced/getPostThreadV2";

import type { GetPostThreadV2UseCase } from "../../../../../application/use-cases/feed/get-post-thread-v2-use-case.js";
import type { AtUriService } from "../../../../../domain/service/at-uri-service.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class GetPostThreadV2 {
  constructor(
    private readonly getPostThreadV2UseCase: GetPostThreadV2UseCase,
    private readonly atUriService: AtUriService,
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getPostThreadV2, {
      auth: (ctx) => this.authVerifierMiddleware.optionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        const uri = await this.atUriService.resolveHostname(
          new AtUri(params.anchor),
        );
        const body = await this.getPostThreadV2UseCase.execute({
          uri,
          above: params.above,
          below: params.below,
          viewerDid: viewerDid || undefined,
        });
        return { body };
      },
    });
  }
}

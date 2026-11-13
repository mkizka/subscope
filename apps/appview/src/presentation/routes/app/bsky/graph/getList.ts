import { type LexRouter, LexServerError } from "@atproto/lex-server";
import { AtUri } from "@atproto/syntax";
import getList from "@repo/client/app/bsky/graph/getList";

import type { GetListUseCase } from "../../../../../application/use-cases/graph/get-list-use-case.js";
import type { AtUriService } from "../../../../../domain/service/at-uri-service.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class GetList {
  constructor(
    private getListUseCase: GetListUseCase,
    private atUriService: AtUriService,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getList, {
      auth: (ctx) => this.authVerifierMiddleware.optionalAuth(ctx),
      handler: async ({ params, credentials: viewerDid }) => {
        const listUri = await this.atUriService.resolveHostname(
          new AtUri(params.list),
        );
        const result = await this.getListUseCase.execute({
          listUri: listUri.getValue(),
          viewerDid,
          limit: params.limit,
          cursor: params.cursor,
        });
        if (!result) {
          throw new LexServerError(400, {
            error: "InvalidRequest",
            message: "List not found",
          });
        }
        return {
          body: result,
        };
      },
    });
  }
}

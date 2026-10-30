import type { LexRouter } from "@atproto/lex-server";
import getTrackedActors from "@repo/client/lex/me/subsco/server/getTrackedActors";

import type { GetTrackedActorsUseCase } from "../../../../../application/use-cases/server/get-tracked-actors-use-case.js";
import type { AuthVerifierMiddleware } from "../../../../../presentation/middleware/auth-verifier-middleware.js";

export class GetTrackedActors {
  constructor(
    private getTrackedActorsUseCase: GetTrackedActorsUseCase,
    private authVerifierMiddleware: AuthVerifierMiddleware,
  ) {}

  handle(router: LexRouter) {
    router.add(getTrackedActors, {
      auth: (ctx) => this.authVerifierMiddleware.loginRequired(ctx),
      handler: async ({ params }) => {
        const result = await this.getTrackedActorsUseCase.execute({
          limit: params.limit,
          cursor: params.cursor,
        });

        return { body: result };
      },
    });
  }
}

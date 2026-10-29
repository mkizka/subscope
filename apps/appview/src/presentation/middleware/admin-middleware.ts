import { LexServerAuthError } from "@atproto/lex-server";

import type { IActorRepository } from "../../application/interfaces/actor-repository.js";
import type { AuthVerifierMiddleware } from "./auth-verifier-middleware.js";

export class AdminMiddleware {
  constructor(
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
    private readonly actorRepository: IActorRepository,
  ) {}
  static inject = ["authVerifierMiddleware", "actorRepository"] as const;

  async requireAdmin(ctx: { request: Request }) {
    const credentials = await this.authVerifierMiddleware.loginRequired(ctx);

    const actor = await this.actorRepository.findByDid(credentials.did);
    // TODO: lexiconに定義したエラーを返す
    if (!actor?.isAdmin) {
      throw new LexServerAuthError(
        "AuthenticationRequired",
        "Admin access required",
      );
    }

    return credentials;
  }
}

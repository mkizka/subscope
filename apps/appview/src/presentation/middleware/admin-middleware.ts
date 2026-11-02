import { LexServerError } from "@atproto/lex-server";

import type { IActorRepository } from "../../application/interfaces/actor-repository.js";
import type { AuthVerifierMiddleware } from "./auth-verifier-middleware.js";

export class AdminMiddleware {
  constructor(
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
    private readonly actorRepository: IActorRepository,
  ) {}

  async requireAdmin(ctx: { request: Request }) {
    const credentials = await this.authVerifierMiddleware.loginRequired(ctx);

    const actor = await this.actorRepository.find(credentials.did);
    if (!actor?.isAdmin) {
      throw new LexServerError(403, {
        error: "Forbidden",
        message: "Admin access required",
      });
    }

    return credentials;
  }
}

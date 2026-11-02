import { LexServerError } from "@atproto/lex-server";

import type { IAccountRepository } from "../../application/interfaces/account-repository.js";
import type { AuthVerifierMiddleware } from "./auth-verifier-middleware.js";

export class AdminMiddleware {
  constructor(
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
    private readonly accountRepository: IAccountRepository,
  ) {}

  async requireAdmin(ctx: { request: Request }) {
    const credentials = await this.authVerifierMiddleware.loginRequired(ctx);

    const account = await this.accountRepository.find(credentials.did);
    if (!account?.isAdmin) {
      throw new LexServerError(403, {
        error: "Forbidden",
        message: "Admin access required",
      });
    }

    return credentials;
  }
}

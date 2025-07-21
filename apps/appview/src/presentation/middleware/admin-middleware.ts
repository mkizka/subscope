import { AuthRequiredError } from "@atproto/xrpc-server";

import { env } from "../../shared/env.js";
import type { AuthVerifierMiddleware } from "./auth-verifier-middleware.js";

type MaybeHeaders = {
  [key: string]: string | string[] | undefined;
};

type MaybeRequest = {
  headers: MaybeHeaders;
  path: string;
};

export class AdminMiddleware {
  constructor(private readonly authVerifier: AuthVerifierMiddleware) {}
  static inject = ["authVerifierMiddleware"] as const;

  async requireAdmin(request: MaybeRequest) {
    const authResult = await this.authVerifier.loginRequired(request);

    if (authResult.credentials.did !== env.ADMIN_DID) {
      throw new AuthRequiredError("Admin access required");
    }

    return authResult;
  }
}

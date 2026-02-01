import { AuthRequiredError } from "@atproto/xrpc-server";

import type { IActorRepository } from "@/server/features/xrpc/application/interfaces/actor-repository.js";

import type { AuthVerifierMiddleware } from "./auth-verifier-middleware.js";

type MaybeHeaders = {
  [key: string]: string | string[] | undefined;
};

type MaybeRequest = {
  headers: MaybeHeaders;
  path: string;
};

export class AdminMiddleware {
  constructor(
    private readonly authVerifierMiddleware: AuthVerifierMiddleware,
    private readonly actorRepository: IActorRepository,
  ) {}
  static inject = ["authVerifierMiddleware", "actorRepository"] as const;

  async requireAdmin(request: MaybeRequest) {
    const authResult = await this.authVerifierMiddleware.loginRequired(request);

    const actor = await this.actorRepository.findByDid(
      authResult.credentials.did,
    );
    // TODO: lexiconに定義したエラーを返す
    if (!actor?.isAdmin) {
      throw new AuthRequiredError("Admin access required");
    }

    return authResult;
  }
}

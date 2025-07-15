import type { IncomingMessage } from "node:http";

import { type Did } from "@atproto/did";
import { AuthRequiredError, parseReqNsid } from "@atproto/xrpc-server";

import type { ITokenVerifier } from "../../application/interfaces/token-verifier.js";

type MaybeHeaders = {
  [key: string]: string | string[] | undefined;
};

type MaybeRequest = {
  headers: MaybeHeaders;
  path: string;
};

export class AuthVerifierMiddleware {
  constructor(private readonly tokenVerifier: ITokenVerifier) {}
  static inject = ["tokenVerifier"] as const;

  async loginRequired(request: MaybeRequest) {
    const authorization =
      request.headers.authorization ?? request.headers.Authorization;
    if (typeof authorization !== "string") {
      throw new AuthRequiredError("Bad authorization header");
    }
    const splitted = authorization.split(" ");
    if (splitted.length !== 2) {
      throw new AuthRequiredError("Bad authorization header");
    }
    const [type, token] = splitted;
    if (!type || type.toLowerCase() !== "bearer") {
      throw new AuthRequiredError("Bad authorization type");
    }
    if (!token) {
      throw new AuthRequiredError("No token provided");
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const nsid = parseReqNsid({ url: request.path } as IncomingMessage);
    const credentials = await this.tokenVerifier.verify({ token, nsid });
    if (!credentials) {
      throw new AuthRequiredError("Invalid token");
    }
    return {
      credentials,
      artifacts: token,
    };
  }

  async getViewerDid(request: MaybeRequest): Promise<Did | null> {
    try {
      const authResult = await this.loginRequired(request);
      return authResult.credentials.did;
    } catch (error) {
      if (error instanceof AuthRequiredError) {
        return null;
      }
      throw error;
    }
  }
}

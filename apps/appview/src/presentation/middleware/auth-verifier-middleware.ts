import type { Did } from "@atproto/did";
import { LexServerAuthError } from "@atproto/lex-server";

import type { ITokenVerifier } from "../../application/interfaces/token-verifier.js";

const extractToken = (request: Request) => {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return null;
  }
  const [type, token, ...rest] = authorization.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token || rest.length > 0) {
    return null;
  }
  return token;
};

export class AuthVerifierMiddleware {
  constructor(private readonly tokenVerifier: ITokenVerifier) {}

  async loginRequired({ request }: { request: Request }) {
    const did = await this.optionalAuth({ request });
    if (!did) {
      throw new LexServerAuthError(
        "AuthenticationRequired",
        "Authentication required",
      );
    }
    return { did };
  }

  async optionalAuth({ request }: { request: Request }): Promise<Did | null> {
    const token = extractToken(request);
    if (!token) {
      return null;
    }
    const nsid = new URL(request.url).pathname.replace(/^\/xrpc\//, "");
    const credentials = await this.tokenVerifier.verify({ token, nsid });
    return credentials?.did ?? null;
  }
}

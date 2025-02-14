import { asDid } from "@atproto/did";
import { verifyJwt } from "@atproto/xrpc-server";
import type { IDidResolver } from "@dawn/common/domain";

import type { ITokenVerifier } from "../application/interfaces/token-verifier.js";
import { env } from "../shared/env.js";

export class TokenVerifier implements ITokenVerifier {
  constructor(private readonly didResolver: IDidResolver) {}
  static inject = ["didResolver"] as const;

  async verify(params: { token: string; nsid: string }) {
    const getSigninKey = async (did: string) => {
      const { signingKey } = await this.didResolver.resolve(did);
      return signingKey;
    };
    const payload = await verifyJwt(
      params.token,
      `did:web:${env.PUBLIC_DOMAIN}`,
      params.nsid,
      getSigninKey,
    );
    /**
     * メモ
     * {
        "iat": 1739279765,
        "iss": "did:plc:thpg3rkgfslxsgeehkhxgdyu",
        "aud": "did:web:appview.apps.mkizka.dev",
        "exp": 1739279825,
        "lxm": "app.bsky.feed.getPosts",
        "jti": "3084314d894565265862b3cd966e9258"
      }
     */
    return { did: asDid(payload.iss) };
  }
}

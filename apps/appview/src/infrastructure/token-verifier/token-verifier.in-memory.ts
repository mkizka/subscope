import type { Did } from "@atproto/did";

import type { ITokenVerifier } from "../../application/interfaces/token-verifier.js";

export class InMemoryTokenVerifier implements ITokenVerifier {
  private result: { did: Did } | null = null;

  setVerifyResult(result: { did: Did } | null): void {
    this.result = result;
  }

  async verify(): Promise<{ did: Did } | null> {
    return this.result;
  }
}

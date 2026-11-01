import type { Did } from "@atproto/did";

import {
  DidNotFoundError,
  type IDidResolver,
} from "../../domain/interfaces/did-resolver.js";
import type { Handle } from "../../utils/handle.js";

type ResolveResult = {
  signingKey: string;
  handle: Handle;
  pds: URL;
};

export class InMemoryDidResolver implements IDidResolver {
  private results: Map<Did, ResolveResult> = new Map();

  setResolveResult(did: Did, result: ResolveResult): void {
    this.results.set(did, result);
  }

  clear(): void {
    this.results.clear();
  }

  async resolve(did: Did): Promise<ResolveResult> {
    const result = this.results.get(did);
    if (!result) {
      throw new DidNotFoundError(did);
    }
    return result;
  }
}

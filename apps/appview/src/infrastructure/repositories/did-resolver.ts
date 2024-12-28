import { DidResolver as Resolver, MemoryCache } from "@atproto/identity";

import type { IDidResolver } from "../../domain/repositories/did-resolver.js";

export class DidResolver implements IDidResolver {
  readonly resolver: Resolver;

  constructor() {
    this.resolver = new Resolver({
      didCache: new MemoryCache(),
    });
  }

  async resolve(did: string) {
    const data = await this.resolver.resolveAtprotoData(did);
    return { handle: data.handle };
  }
}

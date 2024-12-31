import { DidResolver as Resolver, MemoryCache } from "@atproto/identity";

import type { IDidResolver } from "../../domain/interfaces/did-resolver.js";
import { env } from "../../shared/env.js";

export class DidResolver implements IDidResolver {
  readonly resolver: Resolver;

  constructor() {
    this.resolver = new Resolver({
      didCache: new MemoryCache(),
      plcUrl: env.PLC_URL,
    });
  }

  async resolve(did: string) {
    const data = await this.resolver.resolveAtprotoData(did);
    return { handle: data.handle };
  }
}

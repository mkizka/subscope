import { DidResolver as BaseDidResolver, MemoryCache } from "@atproto/identity";

import type { IDidResolver } from "../../application/interfaces/did-resolver.js";
import { env } from "../../shared/env.js";
import { createLogger } from "../../shared/logger.js";

const logger = createLogger("DidResolver");

let resolvedCount = 0;
let cacheExistsCount = 0;

class Resolver extends BaseDidResolver {
  async resolve(did: string) {
    resolvedCount++;
    if (this.cache) {
      const fromCache = await this.cache.checkCache(did);
      if (fromCache && !fromCache.expired) {
        cacheExistsCount++;
      }
    }
    logger.info(
      {
        resolvedCount,
        cacheExistsCount,
        ratio: cacheExistsCount / resolvedCount,
      },
      `Resolving DID: ${did}`,
    );
    return super.resolve(did);
  }
}

export class DidResolver implements IDidResolver {
  readonly resolver: Resolver;

  constructor() {
    this.resolver = new Resolver({
      didCache: new MemoryCache(),
      plcUrl: env.PLC_URL,
    });
  }

  async resolve(did: string) {
    try {
      const data = await this.resolver.resolveAtprotoData(did);
      return { handle: data.handle };
    } catch (error) {
      logger.warn(error, `Failed to resolve DID: ${did}`);
      return null;
    }
  }
}

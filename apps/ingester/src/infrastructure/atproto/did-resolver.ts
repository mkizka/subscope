import { DidResolver as Resolver } from "@atproto/identity";
import type { ILoggerManager, Logger } from "@dawn/common/domain";

import type { IDidResolver } from "../../application/interfaces/did-resolver.js";
import { env } from "../../shared/env.js";
import { RedisDidCache } from "./redis-did-cache.js";

export class DidResolver implements IDidResolver {
  private readonly resolver: Resolver;
  private readonly logger: Logger;

  constructor(loggerManager: ILoggerManager) {
    this.resolver = new Resolver({
      didCache: new RedisDidCache(),
      plcUrl: env.PLC_URL,
    });
    this.logger = loggerManager.createLogger("DidResolver");
  }
  static inject = ["loggerManager"] as const;

  async resolve(did: string) {
    try {
      const data = await this.resolver.resolveAtprotoData(did);
      return { handle: data.handle };
    } catch (error) {
      this.logger.warn(error, `Failed to resolve DID: ${did}`);
      return null;
    }
  }
}

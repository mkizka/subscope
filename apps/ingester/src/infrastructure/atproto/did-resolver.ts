import type { DidCache } from "@atproto/identity";
import { DidResolver as Resolver } from "@atproto/identity";
import type { ILoggerManager, Logger } from "@dawn/common/domain";

import type { IDidResolver } from "../../application/interfaces/did-resolver.js";
import type { IMetric } from "../../application/interfaces/metric.js";
import { env } from "../../shared/env.js";

export class DidResolver implements IDidResolver {
  private readonly resolver: Resolver;
  private readonly logger: Logger;

  constructor(
    loggerManager: ILoggerManager,
    didCache: DidCache,
    private readonly metric: IMetric,
  ) {
    this.resolver = new Resolver({
      didCache,
      plcUrl: env.PLC_URL,
    });
    this.logger = loggerManager.createLogger("DidResolver");
  }
  static inject = ["loggerManager", "didCache", "metric"] as const;

  async resolve(did: string) {
    try {
      this.metric.increment({
        name: "did_resolve_total",
        help: "Total number of did resolves",
      });
      const data = await this.resolver.resolveAtprotoData(did);
      return { handle: data.handle };
    } catch (error) {
      this.metric.increment({
        name: "did_resolve_error_total",
        help: "Total number of did resolve errors",
      });
      this.logger.warn(error, `Failed to resolve DID: ${did}`);
      return null;
    }
  }
}

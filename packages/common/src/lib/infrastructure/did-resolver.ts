import type { DidCache } from "@atproto/identity";
import { DidResolver as Resolver } from "@atproto/identity";

import type { IDidResolver } from "../domain/interfaces/did-resolver.js";
import type { ILoggerManager, Logger } from "../domain/interfaces/logger.js";
import type { IMetricReporter } from "../domain/interfaces/metric.js";

export class DidResolver implements IDidResolver {
  private readonly resolver: Resolver;
  private readonly logger: Logger;

  constructor(
    plcUrl: string,
    loggerManager: ILoggerManager,
    didCache: DidCache,
    private readonly metricReporter: IMetricReporter,
  ) {
    this.resolver = new Resolver({ didCache, plcUrl });
    this.logger = loggerManager.createLogger("DidResolver");
  }
  static inject = [
    "plcUrl",
    "loggerManager",
    "didCache",
    "metricReporter",
  ] as const;

  async resolve(did: string) {
    try {
      this.metricReporter.increment("did_resolve_total");
      return await this.resolver.resolveAtprotoData(did);
    } catch (error) {
      this.metricReporter.increment("did_resolve_error_total");
      this.logger.warn(error, `Failed to resolve DID: ${did}`);
      throw error;
    }
  }
}

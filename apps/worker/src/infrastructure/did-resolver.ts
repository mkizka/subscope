import type { DidCache } from "@atproto/identity";
import { DidResolver as Resolver } from "@atproto/identity";
import type {
  ILoggerManager,
  IMetricReporter,
  Logger,
} from "@dawn/common/domain";

import type { IDidResolver } from "../application/interfaces/did-resolver.js";
import { env } from "../shared/env.js";

export class DidResolver implements IDidResolver {
  private readonly resolver: Resolver;
  private readonly logger: Logger;

  constructor(
    loggerManager: ILoggerManager,
    didCache: DidCache,
    private readonly metricReporter: IMetricReporter,
  ) {
    this.resolver = new Resolver({
      didCache,
      plcUrl: env.PLC_URL,
    });
    this.logger = loggerManager.createLogger("DidResolver");
  }
  static inject = ["loggerManager", "didCache", "metricReporter"] as const;

  async resolve(did: string) {
    try {
      this.metricReporter.increment("did_resolve_total");
      const data = await this.resolver.resolveAtprotoData(did);
      return { handle: data.handle };
    } catch (error) {
      this.metricReporter.increment("did_resolve_error_total");
      this.logger.warn(error, `Failed to resolve DID: ${did}`);
      return null;
    }
  }
}

import type { DidCache, DidResolverOpts } from "@atproto/identity";
import { DidResolver as AtprotoDidResolver } from "@atproto/identity";

import {
  DidResolutionError,
  type IDidResolver,
} from "../../domain/interfaces/did-resolver.js";
import type { ILoggerManager, Logger } from "../../domain/interfaces/logger.js";
import type { IMetricReporter } from "../../domain/interfaces/metric.js";
import { asHandle } from "../../utils/handle.js";

class Resolver extends AtprotoDidResolver {
  constructor(
    options: DidResolverOpts,
    private readonly metricReporter: IMetricReporter,
  ) {
    super(options);
  }

  async resolveNoCheck(did: string): Promise<unknown> {
    this.metricReporter.increment("resolve_did_request_total");
    return await super.resolveNoCheck(did);
  }
}

export class DidResolver implements IDidResolver {
  private readonly resolver: Resolver;
  private readonly logger: Logger;

  constructor(
    plcUrl: string,
    loggerManager: ILoggerManager,
    didCache: DidCache,
    private readonly metricReporter: IMetricReporter,
  ) {
    this.resolver = new Resolver({ didCache, plcUrl }, metricReporter);
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
      const data = await this.resolver.resolveAtprotoData(did);
      return {
        signingKey: data.signingKey,
        handle: asHandle(data.handle),
        pds: new URL(data.pds),
      };
    } catch (error) {
      this.metricReporter.increment("resolve_did_error_total");
      this.logger.warn(error, `Failed to resolve DID: ${did}`);
      throw new DidResolutionError(did);
    }
  }
}

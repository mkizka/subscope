import { DidResolver as AtprotoDidResolver } from "@atproto/identity";
import { DidResolutionError } from "../../domain/interfaces/did-resolver.js";
import { asHandle } from "../../utils/handle.js";
class Resolver extends AtprotoDidResolver {
  metricReporter;
  constructor(options, metricReporter) {
    super(options);
    this.metricReporter = metricReporter;
  }
  async resolveNoCheck(did) {
    this.metricReporter.increment("resolve_did_request_total");
    return await super.resolveNoCheck(did);
  }
}
export class DidResolver {
  metricReporter;
  resolver;
  logger;
  constructor(plcUrl, loggerManager, didCache, metricReporter) {
    this.metricReporter = metricReporter;
    const fetch =
      new URL(plcUrl).protocol === "http:" ? globalThis.fetch : undefined;
    this.resolver = new Resolver({ didCache, plcUrl, fetch }, metricReporter);
    this.logger = loggerManager.createLogger("DidResolver");
  }
  async resolve(did) {
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

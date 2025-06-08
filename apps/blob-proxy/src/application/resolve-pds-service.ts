import type { Did } from "@atproto/did";
import type { IDidResolver } from "@dawn/common/domain";
import type { ILoggerManager, Logger } from "@dawn/common/domain";

export class ResolvePdsService {
  private logger: Logger;
  static inject = ["didResolver", "loggerManager"] as const;

  constructor(
    private didResolver: IDidResolver,
    loggerManager: ILoggerManager,
  ) {
    this.logger = loggerManager.createLogger("ResolvePdsService");
  }

  async resolve(did: Did): Promise<string> {
    this.logger.debug({ did }, "Resolving DID to PDS URL");

    const resolved = await this.didResolver.resolve(did);
    const pdsUrl = resolved.pds.toString();

    this.logger.debug({ did, pdsUrl }, "Successfully resolved PDS URL");
    return pdsUrl;
  }
}

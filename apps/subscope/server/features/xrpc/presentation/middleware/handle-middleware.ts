import { type Did, isDid } from "@atproto/did";
import type { ILoggerManager, Logger } from "@repo/common/domain";
import { type Handle, isHandle } from "@repo/common/utils";

import type { IHandleResolver } from "@/server/features/xrpc/application/interfaces/handle-resolver.js";

export class HandleMiddleware {
  private readonly logger: Logger;

  constructor(
    private readonly handleResolver: IHandleResolver,
    loggerManager: ILoggerManager,
  ) {
    this.logger = loggerManager.createLogger("HandleMiddleware");
  }
  static inject = ["handleResolver", "loggerManager"] as const;

  async resolveHandleOrDid(handleOrDid: Handle | Did): Promise<Did> {
    if (isDid(handleOrDid)) {
      return handleOrDid;
    }
    return this.handleResolver.resolve(handleOrDid);
  }

  async resolveHandleOrDids(handleOrDids: (Handle | Did)[]): Promise<Did[]> {
    const handles = handleOrDids.filter((item) => isHandle(item));
    const didsMap = await this.handleResolver.resolveMany(handles);
    return handleOrDids
      .map((item) => {
        if (isHandle(item)) {
          const resolvedDid = didsMap[item];
          if (!resolvedDid) {
            this.logger.warn(`Handle not resolved: ${item}`);
            return null;
          }
          return resolvedDid;
        }
        return item;
      })
      .filter((did) => !!did);
  }
}

import { HandleResolver as AtprotoHandleResolver } from "@atproto/identity";
import type { Handle } from "@repo/common/utils";

import type { IHandleResolver } from "../../application/interfaces/external/handle-resolver.js";

export class HandleResolver implements IHandleResolver {
  private readonly resolver = new AtprotoHandleResolver();

  async resolve(handle: Handle) {
    return await this.resolver.resolve(handle);
  }
}

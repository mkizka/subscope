import type { Did } from "@atproto/did";
import type { Handle } from "@repo/common/utils";

import type { IHandleResolver } from "../../application/interfaces/external/handle-resolver.js";

export class InMemoryHandleResolver implements IHandleResolver {
  private handleToDid: Map<Handle, Did> = new Map();

  add(handle: Handle, did: Did): void {
    this.handleToDid.set(handle, did);
  }

  resolve(handle: Handle): Promise<string | undefined> {
    return Promise.resolve(this.handleToDid.get(handle));
  }
}

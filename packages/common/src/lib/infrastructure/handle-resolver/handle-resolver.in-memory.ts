import type { Did } from "@atproto/did";

import type { IHandleResolver } from "../../interface/handle-resolver.js";
import type { Handle } from "../../utils/handle.js";

export class InMemoryHandleResolver implements IHandleResolver {
  private handleToDid: Map<Handle, Did> = new Map();

  add(handle: Handle, did: Did): void {
    this.handleToDid.set(handle, did);
  }

  resolve(handle: Handle): Promise<string | undefined> {
    return Promise.resolve(this.handleToDid.get(handle));
  }
}

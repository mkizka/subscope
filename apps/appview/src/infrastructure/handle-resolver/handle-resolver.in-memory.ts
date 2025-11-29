import type { Did } from "@atproto/did";
import type { Handle } from "@repo/common/utils";

import {
  HandleResolutionError,
  type IHandleResolver,
} from "../../application/interfaces/handle-resolver.js";

export class InMemoryHandleResolver implements IHandleResolver {
  private handleToDid: Map<Handle, Did> = new Map();

  add(handle: Handle, did: Did): void {
    this.handleToDid.set(handle, did);
  }

  clear(): void {
    this.handleToDid.clear();
  }

  async resolve(handle: Handle): Promise<Did> {
    const did = this.handleToDid.get(handle);
    if (!did) {
      throw new HandleResolutionError(handle);
    }
    return Promise.resolve(did);
  }

  async resolveMany(handles: Handle[]): Promise<Record<Handle, Did>> {
    return Promise.resolve(
      handles.reduce<Record<Handle, Did>>((acc, handle) => {
        const did = this.handleToDid.get(handle);
        if (did) {
          acc[handle] = did;
        }
        return acc;
      }, {}),
    );
  }
}

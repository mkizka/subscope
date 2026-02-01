import type { Did } from "@atproto/did";
import type { Handle } from "@repo/common/utils";

export interface IHandleResolver {
  resolve: (handle: Handle) => Promise<Did>;
  resolveMany: (handles: Handle[]) => Promise<Record<Handle, Did>>;
}

export class HandleResolutionError extends Error {
  constructor(handle: string) {
    super(`Failed to resolve handle: ${handle}`);
    this.name = "HandleResolutionError";
  }
}

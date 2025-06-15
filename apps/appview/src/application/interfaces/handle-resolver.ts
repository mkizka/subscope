import type { Did } from "@atproto/did";
import type { Handle } from "@repo/common/utils";

export interface IHandleResolver {
  resolveMany: (handles: Handle[]) => Promise<Record<Handle, Did>>;
}

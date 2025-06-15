import type { Did } from "@atproto/did";
import type { Handle } from "@repo/common/utils";

// HandleResolverとかに名前変える
export interface IHandlesToDidsRepository {
  findDidsByHandle: (handles: Handle[]) => Promise<Record<Handle, Did>>;
}

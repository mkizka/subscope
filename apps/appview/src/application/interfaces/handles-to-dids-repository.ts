import type { Did } from "@atproto/did";
import type { Handle } from "@repo/common/utils";

export interface IHandlesToDidsRepository {
  findDidsByHandle: (handles: Handle[]) => Promise<Record<Handle, Did>>;
}

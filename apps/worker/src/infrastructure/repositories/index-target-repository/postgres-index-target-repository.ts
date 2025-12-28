import type { Did } from "@atproto/did";
import type { IIndexTargetRepository } from "@repo/common/domain";

export class PostgresIndexTargetRepository implements IIndexTargetRepository {
  isSubscriber(_did: Did): Promise<boolean> {
    return Promise.reject(new Error("Not implemented"));
  }

  hasSubscriber(_dids: Did[]): Promise<boolean> {
    return Promise.reject(new Error("Not implemented"));
  }

  addSubscriber(_did: Did): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }

  removeSubscriber(_did: Did): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }

  clear(): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }

  bulkAddSubscribers(_dids: Did[]): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }
}

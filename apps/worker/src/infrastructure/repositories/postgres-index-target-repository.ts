import type { Did } from "@atproto/did";
import type { IIndexTargetRepository } from "@repo/common/domain";

import type { ITrackedActorChecker } from "../../application/interfaces/repositories/tracked-actor-checker.js";

export class PostgresIndexTargetRepository implements IIndexTargetRepository {
  constructor(private readonly trackedActorChecker: ITrackedActorChecker) {}
  static inject = ["trackedActorChecker"] as const;

  isSubscriber(_did: Did): Promise<boolean> {
    return Promise.reject(new Error("Not implemented"));
  }

  hasSubscriber(_dids: Did[]): Promise<boolean> {
    return Promise.reject(new Error("Not implemented"));
  }

  async isTrackedActor(did: Did): Promise<boolean> {
    return this.trackedActorChecker.isTrackedActor(did);
  }

  async hasTrackedActor(dids: Did[]): Promise<boolean> {
    return this.trackedActorChecker.hasTrackedActor(dids);
  }

  addSubscriber(_did: Did): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }

  removeSubscriber(_did: Did): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }

  addTrackedActor(_did: Did): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }

  removeTrackedActor(_did: Did): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }

  clear(): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }

  bulkAddSubscribers(_dids: Did[]): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }

  bulkAddTrackedActors(_dids: Did[]): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }
}

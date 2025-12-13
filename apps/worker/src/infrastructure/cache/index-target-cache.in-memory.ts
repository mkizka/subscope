import type { Did } from "@atproto/did";

import type { IIndexTargetCache } from "../../domain/index-target/index-target-cache.ts";
import type { IIndexTargetQuery } from "../../domain/index-target/index-target-query.ts";

export class InMemoryIndexTargetCache
  implements IIndexTargetQuery, IIndexTargetCache
{
  private subscribers = new Set<Did>();
  private trackedActors = new Set<Did>();

  async isSubscriber(did: Did): Promise<boolean> {
    return this.subscribers.has(did);
  }

  async hasSubscriber(dids: Did[]): Promise<boolean> {
    return dids.some((did) => this.subscribers.has(did));
  }

  async isTrackedActor(did: Did): Promise<boolean> {
    return this.trackedActors.has(did);
  }

  async hasTrackedActor(dids: Did[]): Promise<boolean> {
    return dids.some((did) => this.trackedActors.has(did));
  }

  async addSubscriber(did: Did): Promise<void> {
    this.subscribers.add(did);
  }

  async removeSubscriber(did: Did): Promise<void> {
    this.subscribers.delete(did);
  }

  async addTrackedActor(did: Did): Promise<void> {
    this.trackedActors.add(did);
  }

  async removeTrackedActor(did: Did): Promise<void> {
    this.trackedActors.delete(did);
  }

  async bulkAddSubscribers(dids: Did[]): Promise<void> {
    for (const did of dids) {
      this.subscribers.add(did);
    }
  }

  async bulkAddTrackedActors(dids: Did[]): Promise<void> {
    for (const did of dids) {
      this.trackedActors.add(did);
    }
  }

  async clear(): Promise<void> {
    this.subscribers.clear();
    this.trackedActors.clear();
  }
}

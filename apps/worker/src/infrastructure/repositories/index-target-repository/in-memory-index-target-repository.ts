import type { Did } from "@atproto/did";
import type { IIndexTargetRepository } from "@repo/common/domain";

export class InMemoryIndexTargetRepository implements IIndexTargetRepository {
  private subscribers: Set<string> = new Set();
  private trackedActors: Set<string> = new Set();

  async clear(): Promise<void> {
    this.subscribers.clear();
    this.trackedActors.clear();
  }

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
}

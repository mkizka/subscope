import type { Did } from "@atproto/did";
import type { IIndexTargetRepository } from "@repo/common/domain";

export class InMemoryIndexTargetRepository implements IIndexTargetRepository {
  private subscribers: Set<string> = new Set();
  private trackedActors: Set<string> = new Set();

  clear(): Promise<void> {
    this.subscribers.clear();
    this.trackedActors.clear();
    return Promise.resolve();
  }

  isSubscriber(did: Did): Promise<boolean> {
    return Promise.resolve(this.subscribers.has(did));
  }

  hasSubscriber(dids: Did[]): Promise<boolean> {
    return Promise.resolve(dids.some((did) => this.subscribers.has(did)));
  }

  isTrackedActor(did: Did): Promise<boolean> {
    return Promise.resolve(this.trackedActors.has(did));
  }

  hasTrackedActor(dids: Did[]): Promise<boolean> {
    return Promise.resolve(dids.some((did) => this.trackedActors.has(did)));
  }

  addSubscriber(did: Did): Promise<void> {
    this.subscribers.add(did);
    return Promise.resolve();
  }

  removeSubscriber(did: Did): Promise<void> {
    this.subscribers.delete(did);
    return Promise.resolve();
  }

  addTrackedActor(did: Did): Promise<void> {
    this.trackedActors.add(did);
    return Promise.resolve();
  }

  removeTrackedActor(did: Did): Promise<void> {
    this.trackedActors.delete(did);
    return Promise.resolve();
  }

  bulkAddSubscribers(dids: Did[]): Promise<void> {
    for (const did of dids) {
      this.subscribers.add(did);
    }
    return Promise.resolve();
  }

  bulkAddTrackedActors(dids: Did[]): Promise<void> {
    for (const did of dids) {
      this.trackedActors.add(did);
    }
    return Promise.resolve();
  }
}

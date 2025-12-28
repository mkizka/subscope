import type { Did } from "@atproto/did";
import type { IIndexTargetRepository } from "@repo/common/domain";

export class InMemoryIndexTargetRepository implements IIndexTargetRepository {
  private subscribers: Set<string> = new Set();

  clear(): void {
    this.subscribers.clear();
  }

  async isSubscriber(did: Did): Promise<boolean> {
    return this.subscribers.has(did);
  }

  async hasSubscriber(dids: Did[]): Promise<boolean> {
    return dids.some((did) => this.subscribers.has(did));
  }

  async addSubscriber(did: Did): Promise<void> {
    this.subscribers.add(did);
  }

  async removeSubscriber(did: Did): Promise<void> {
    this.subscribers.delete(did);
  }

  async bulkAddSubscribers(dids: Did[]): Promise<void> {
    for (const did of dids) {
      this.subscribers.add(did);
    }
  }
}

import type { Did } from "@atproto/did";

import type { IIndexTargetRepository } from "../../../application/interfaces/repositories/index-target-repository.js";

interface FollowData {
  uri: string;
  actorDid: Did;
  subjectDid: Did;
}

export class InMemoryIndexTargetRepository implements IIndexTargetRepository {
  private subscribers: Set<Did> = new Set();
  private follows: Map<string, FollowData> = new Map();

  addSubscriber(did: Did): void {
    this.subscribers.add(did);
  }

  addFollow(data: FollowData): void {
    this.follows.set(data.uri, data);
  }

  clear(): void {
    this.subscribers.clear();
    this.follows.clear();
  }

  async findAllSubscriberDids(): Promise<Did[]> {
    return Array.from(this.subscribers);
  }

  async findFolloweeDids(subscriberDid: Did): Promise<Did[]> {
    const followeeDids: Did[] = [];
    for (const follow of this.follows.values()) {
      if (follow.actorDid === subscriberDid) {
        followeeDids.push(follow.subjectDid);
      }
    }
    return followeeDids;
  }

  async findFollowerDid(followUri: string): Promise<Did | null> {
    const follow = this.follows.get(followUri);
    return follow ? follow.actorDid : null;
  }

  async findFolloweeDid(followUri: string): Promise<Did | null> {
    const follow = this.follows.get(followUri);
    return follow ? follow.subjectDid : null;
  }
}

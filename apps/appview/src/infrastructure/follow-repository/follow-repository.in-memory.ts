import type { Did } from "@atproto/did";
import type { Follow } from "@repo/common/domain";

import type { IFollowRepository } from "../../application/interfaces/follow-repository.js";

export class InMemoryFollowRepository implements IFollowRepository {
  private follows: Follow[] = [];

  add(follow: Follow): void {
    this.follows.push(follow);
  }

  clear(): void {
    this.follows = [];
  }

  findFollows(params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }): Promise<Follow[]> {
    let items = this.follows.filter(
      (follow) => follow.actorDid === params.actorDid,
    );

    if (params.cursor) {
      const cursorDate = new Date(params.cursor);
      items = items.filter((follow) => follow.sortAt < cursorDate);
    }

    items.sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime());

    return Promise.resolve(items.slice(0, params.limit));
  }

  findFolloweeDids(actorDid: Did): Promise<Did[]> {
    return Promise.resolve(
      this.follows
        .filter((follow) => follow.actorDid === actorDid)
        .map((follow) => follow.subjectDid),
    );
  }

  findFollowers(params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }): Promise<Follow[]> {
    let items = this.follows.filter(
      (follow) => follow.subjectDid === params.actorDid,
    );

    if (params.cursor) {
      const cursorDate = new Date(params.cursor);
      items = items.filter((follow) => follow.sortAt < cursorDate);
    }

    items.sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime());

    return Promise.resolve(items.slice(0, params.limit));
  }
}

import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import type { Follow } from "@repo/common/domain";

import type { IFollowRepository } from "../../application/interfaces/follow-repository.js";

export class InMemoryFollowRepository implements IFollowRepository {
  private follows: Follow[] = [];

  add(follow: Follow): void {
    this.follows.push(follow);
  }

  addAll(follows: Follow[]): void {
    this.follows.push(...follows);
  }

  clear(): void {
    this.follows = [];
  }

  private getSortAt(follow: Follow): Date {
    return follow.indexedAt < follow.createdAt
      ? follow.indexedAt
      : follow.createdAt;
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
      items = items.filter((follow) => this.getSortAt(follow) < cursorDate);
    }

    items.sort(
      (a, b) => this.getSortAt(b).getTime() - this.getSortAt(a).getTime(),
    );

    return Promise.resolve(items.slice(0, params.limit));
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
      items = items.filter((follow) => this.getSortAt(follow) < cursorDate);
    }

    items.sort(
      (a, b) => this.getSortAt(b).getTime() - this.getSortAt(a).getTime(),
    );

    return Promise.resolve(items.slice(0, params.limit));
  }

  findFollowingMap(params: {
    actorDid: Did;
    targetDids: Did[];
  }): Promise<Map<Did, AtUri>> {
    if (params.targetDids.length === 0) {
      return Promise.resolve(new Map<Did, AtUri>());
    }

    const followingMap = new Map<Did, AtUri>();

    for (const follow of this.follows) {
      if (
        follow.actorDid === params.actorDid &&
        params.targetDids.includes(follow.subjectDid)
      ) {
        followingMap.set(follow.subjectDid, follow.uri);
      }
    }

    return Promise.resolve(followingMap);
  }

  findFollowedByMap(params: {
    actorDid: Did;
    targetDids: Did[];
  }): Promise<Map<Did, AtUri>> {
    if (params.targetDids.length === 0) {
      return Promise.resolve(new Map<Did, AtUri>());
    }

    const followedByMap = new Map<Did, AtUri>();

    for (const follow of this.follows) {
      if (
        params.targetDids.includes(follow.actorDid) &&
        follow.subjectDid === params.actorDid
      ) {
        followedByMap.set(follow.actorDid, follow.uri);
      }
    }

    return Promise.resolve(followedByMap);
  }
}

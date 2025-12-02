import type { TransactionContext } from "@repo/common/domain";

import type { IActorStatsRepository } from "../../../application/interfaces/repositories/actor-stats-repository.js";

export interface ActorStats {
  followsCount: number;
  followersCount: number;
  postsCount: number;
}

export class InMemoryActorStatsRepository implements IActorStatsRepository {
  private stats: Map<string, ActorStats> = new Map();
  private follows: Map<string, Set<string>> = new Map();
  private followers: Map<string, Set<string>> = new Map();
  private posts: Map<string, Set<string>> = new Map();

  clear(): void {
    this.stats.clear();
    this.follows.clear();
    this.followers.clear();
    this.posts.clear();
  }

  get(actorDid: string): ActorStats | undefined {
    return this.stats.get(actorDid);
  }

  getAll(): Map<string, ActorStats> {
    return new Map(this.stats);
  }

  addFollow(actorDid: string, followUri: string): void {
    let followSet = this.follows.get(actorDid);
    if (!followSet) {
      followSet = new Set();
      this.follows.set(actorDid, followSet);
    }
    followSet.add(followUri);
  }

  addFollower(actorDid: string, followerUri: string): void {
    let followerSet = this.followers.get(actorDid);
    if (!followerSet) {
      followerSet = new Set();
      this.followers.set(actorDid, followerSet);
    }
    followerSet.add(followerUri);
  }

  addPost(actorDid: string, postUri: string): void {
    let postSet = this.posts.get(actorDid);
    if (!postSet) {
      postSet = new Set();
      this.posts.set(actorDid, postSet);
    }
    postSet.add(postUri);
  }

  private getOrCreateStats(actorDid: string): ActorStats {
    let stats = this.stats.get(actorDid);
    if (!stats) {
      stats = {
        followsCount: 0,
        followersCount: 0,
        postsCount: 0,
      };
      this.stats.set(actorDid, stats);
    }
    return stats;
  }

  async upsertFollowsCount({
    actorDid,
  }: {
    ctx: TransactionContext;
    actorDid: string;
  }): Promise<void> {
    const stats = this.getOrCreateStats(actorDid);
    const followsCount = this.follows.get(actorDid)?.size ?? 0;
    stats.followsCount = followsCount;
  }

  async upsertFollowersCount({
    actorDid,
  }: {
    ctx: TransactionContext;
    actorDid: string;
  }): Promise<void> {
    const stats = this.getOrCreateStats(actorDid);
    const followersCount = this.followers.get(actorDid)?.size ?? 0;
    stats.followersCount = followersCount;
  }

  async upsertPostsCount({
    actorDid,
  }: {
    ctx: TransactionContext;
    actorDid: string;
  }): Promise<void> {
    const stats = this.getOrCreateStats(actorDid);
    const postsCount = this.posts.get(actorDid)?.size ?? 0;
    stats.postsCount = postsCount;
  }
}

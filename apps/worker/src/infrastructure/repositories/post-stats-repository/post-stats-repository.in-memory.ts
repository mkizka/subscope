import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";

import type { IPostStatsRepository } from "../../../application/interfaces/repositories/post-stats-repository.js";

export interface PostStats {
  likeCount: number;
  repostCount: number;
  replyCount: number;
  quoteCount: number;
}

export class InMemoryPostStatsRepository implements IPostStatsRepository {
  private stats: Map<string, PostStats> = new Map();
  private likes: Map<string, Set<string>> = new Map();
  private reposts: Map<string, Set<string>> = new Map();
  private replies: Map<string, Set<string>> = new Map();
  private quotes: Map<string, Set<string>> = new Map();

  clear(): void {
    this.stats.clear();
    this.likes.clear();
    this.reposts.clear();
    this.replies.clear();
    this.quotes.clear();
  }

  addLike(postUri: string, likeUri: string): void {
    let likeSet = this.likes.get(postUri);
    if (!likeSet) {
      likeSet = new Set();
      this.likes.set(postUri, likeSet);
    }
    likeSet.add(likeUri);
  }

  addRepost(postUri: string, repostUri: string): void {
    let repostSet = this.reposts.get(postUri);
    if (!repostSet) {
      repostSet = new Set();
      this.reposts.set(postUri, repostSet);
    }
    repostSet.add(repostUri);
  }

  addReply(postUri: string, replyUri: string): void {
    let replySet = this.replies.get(postUri);
    if (!replySet) {
      replySet = new Set();
      this.replies.set(postUri, replySet);
    }
    replySet.add(replyUri);
  }

  addQuote(postUri: string, quoteUri: string): void {
    let quoteSet = this.quotes.get(postUri);
    if (!quoteSet) {
      quoteSet = new Set();
      this.quotes.set(postUri, quoteSet);
    }
    quoteSet.add(quoteUri);
  }

  private getOrCreateStats(postUri: string): PostStats {
    let stats = this.stats.get(postUri);
    if (!stats) {
      stats = {
        likeCount: 0,
        repostCount: 0,
        replyCount: 0,
        quoteCount: 0,
      };
      this.stats.set(postUri, stats);
    }
    return stats;
  }

  async upsertLikeCount({
    uri,
  }: {
    ctx: TransactionContext;
    uri: AtUri;
  }): Promise<void> {
    const postUri = uri.toString();
    const stats = this.getOrCreateStats(postUri);
    const likeCount = this.likes.get(postUri)?.size ?? 0;
    stats.likeCount = likeCount;
  }

  async upsertRepostCount({
    uri,
  }: {
    ctx: TransactionContext;
    uri: AtUri;
  }): Promise<void> {
    const postUri = uri.toString();
    const stats = this.getOrCreateStats(postUri);
    const repostCount = this.reposts.get(postUri)?.size ?? 0;
    stats.repostCount = repostCount;
  }

  async upsertReplyCount({
    uri,
  }: {
    ctx: TransactionContext;
    uri: AtUri;
  }): Promise<void> {
    const postUri = uri.toString();
    const stats = this.getOrCreateStats(postUri);
    const replyCount = this.replies.get(postUri)?.size ?? 0;
    stats.replyCount = replyCount;
  }

  async upsertQuoteCount({
    uri,
  }: {
    ctx: TransactionContext;
    uri: AtUri;
  }): Promise<void> {
    const postUri = uri.toString();
    const stats = this.getOrCreateStats(postUri);
    const quoteCount = this.quotes.get(postUri)?.size ?? 0;
    stats.quoteCount = quoteCount;
  }

  async upsertAllCount({
    uri,
  }: {
    ctx: TransactionContext;
    uri: AtUri;
  }): Promise<void> {
    const postUri = uri.toString();
    const stats = this.getOrCreateStats(postUri);
    stats.likeCount = this.likes.get(postUri)?.size ?? 0;
    stats.repostCount = this.reposts.get(postUri)?.size ?? 0;
    stats.replyCount = this.replies.get(postUri)?.size ?? 0;
    stats.quoteCount = this.quotes.get(postUri)?.size ?? 0;
  }
}

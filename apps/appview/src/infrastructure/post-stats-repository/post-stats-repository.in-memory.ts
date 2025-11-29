import type { AtUri } from "@atproto/syntax";

import type {
  IPostStatsRepository,
  PostStats,
} from "../../application/interfaces/post-stats-repository.js";

export class InMemoryPostStatsRepository implements IPostStatsRepository {
  private stats: Map<string, PostStats> = new Map();

  add(uri: string, stats: PostStats): void {
    this.stats.set(uri, stats);
  }

  clear(): void {
    this.stats.clear();
  }

  async findMap(uris: AtUri[]): Promise<Map<string, PostStats>> {
    const result = new Map<string, PostStats>();

    for (const uri of uris) {
      const uriStr = uri.toString();
      const stat = this.stats.get(uriStr);
      if (stat) {
        result.set(uriStr, stat);
      }
    }

    return result;
  }
}

import type { AtUri } from "@atproto/syntax";

import type { PostStatsDto } from "../../application/dto/post-stats-dto.js";
import type { IPostStatsQuery } from "../../application/interfaces/post-stats-query.js";

export class InMemoryPostStatsQuery implements IPostStatsQuery {
  private stats: Map<string, PostStatsDto> = new Map();

  add(uri: string, stats: Omit<PostStatsDto, "uri">): void {
    this.stats.set(uri, { uri, ...stats });
  }

  clear(): void {
    this.stats.clear();
  }

  findStats(uris: AtUri[]): Promise<PostStatsDto[]> {
    return Promise.resolve(
      uris.flatMap((uri) => this.stats.get(uri.toString()) ?? []),
    );
  }
}

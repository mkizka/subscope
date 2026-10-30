import type { AtUri } from "@atproto/syntax";

import type { PostStatsDto } from "../dto/post-stats-dto.js";

export interface IPostStatsQuery {
  findStats: (uris: AtUri[]) => Promise<PostStatsDto[]>;
}

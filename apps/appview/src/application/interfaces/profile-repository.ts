import type { Did } from "@atproto/did";
import type { ProfileDetailed } from "@repo/common/domain";

export interface SearchResult {
  profiles: ProfileDetailed[];
  cursor?: string;
}

export interface IProfileRepository {
  findManyDetailed: (dids: Did[]) => Promise<ProfileDetailed[]>;
  search: (
    query: string,
    limit: number,
    cursor?: string,
  ) => Promise<SearchResult>;
}

import type { Did } from "@atproto/did";
import type { ProfileDetailed } from "@repo/common/domain";

export interface IProfileRepository {
  findManyDetailed: (dids: Did[]) => Promise<ProfileDetailed[]>;
  searchActors: (params: {
    query: string;
    limit: number;
    cursor?: string;
  }) => Promise<ProfileDetailed[]>;
}

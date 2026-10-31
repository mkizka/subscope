import type { ProfileDetailed } from "@repo/common/domain";

export interface IProfileRepository {
  searchActors: (params: {
    query: string;
    limit: number;
    cursor?: string;
  }) => Promise<ProfileDetailed[]>;
}

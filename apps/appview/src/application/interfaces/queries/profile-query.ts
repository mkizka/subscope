import type { Did } from "@atproto/did";

import type { ProfileDto } from "../../dto/profile-dto.js";

export interface IProfileQuery {
  findByDids: (dids: Did[]) => Promise<ProfileDto[]>;
  search: (params: {
    query: string;
    limit: number;
    cursor?: Date;
  }) => Promise<ProfileDto[]>;
}

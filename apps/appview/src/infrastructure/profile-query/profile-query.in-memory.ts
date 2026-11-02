import type { Did } from "@atproto/did";

import type { ProfileDto } from "../../application/dto/profile-dto.js";
import type { IProfileQuery } from "../../application/interfaces/profile-query.js";

export class InMemoryProfileQuery implements IProfileQuery {
  private profiles: Map<Did, ProfileDto> = new Map();

  add(profile: ProfileDto): void {
    this.profiles.set(profile.actorDid, profile);
  }

  clear(): void {
    this.profiles.clear();
  }

  findByDids(dids: Did[]): Promise<ProfileDto[]> {
    return Promise.resolve(dids.flatMap((did) => this.profiles.get(did) ?? []));
  }

  search(params: {
    query: string;
    limit: number;
    cursor?: Date;
  }): Promise<ProfileDto[]> {
    const query = params.query.toLowerCase();
    const { cursor } = params;
    const profiles = Array.from(this.profiles.values())
      .filter(
        (profile) =>
          (profile.displayName?.toLowerCase().includes(query) ||
            profile.handle?.toLowerCase().includes(query)) &&
          (!cursor || profile.indexedAt < cursor),
      )
      .sort((a, b) => b.indexedAt.getTime() - a.indexedAt.getTime());
    return Promise.resolve(profiles.slice(0, params.limit));
  }
}

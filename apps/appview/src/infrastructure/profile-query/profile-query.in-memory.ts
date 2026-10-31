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
}

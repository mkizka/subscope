import type { Did } from "@atproto/did";
import type { ProfileDetailed } from "@repo/common/domain";

import type { IProfileRepository } from "../../application/interfaces/profile-repository.js";

export class InMemoryProfileRepository implements IProfileRepository {
  private profiles: Map<Did, ProfileDetailed> = new Map();

  add(profile: ProfileDetailed): void {
    this.profiles.set(profile.actorDid, profile);
  }

  clear(): void {
    this.profiles.clear();
  }

  async findManyDetailed(dids: Did[]): Promise<ProfileDetailed[]> {
    return dids
      .map((did) => this.profiles.get(did))
      .filter((profile): profile is ProfileDetailed => profile !== undefined);
  }

  async searchActors(params: {
    query: string;
    limit: number;
    cursor?: string;
  }): Promise<ProfileDetailed[]> {
    const query = params.query.toLowerCase();

    let profiles = Array.from(this.profiles.values()).filter((profile) => {
      const displayName = profile.displayName?.toLowerCase() ?? "";
      const handle = profile.handle?.toLowerCase() ?? "";
      return displayName.includes(query) || handle.includes(query);
    });

    profiles = profiles.sort(
      (a, b) => b.indexedAt.getTime() - a.indexedAt.getTime(),
    );

    if (params.cursor) {
      const cursorDate = new Date(params.cursor);
      profiles = profiles.filter((profile) => profile.indexedAt < cursorDate);
    }

    return profiles.slice(0, params.limit);
  }
}

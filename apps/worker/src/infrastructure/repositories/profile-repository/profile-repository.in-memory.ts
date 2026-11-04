import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";

import type { Profile } from "../../../application/dto/profile.js";
import type { IProfileRepository } from "../../../application/interfaces/repositories/profile-repository.js";

export class InMemoryProfileRepository implements IProfileRepository {
  private profiles: Map<string, Profile> = new Map();

  add(profile: Profile): void {
    this.profiles.set(profile.uri, profile);
  }

  clear(): void {
    this.profiles.clear();
  }

  async find({
    uri,
  }: {
    ctx: TransactionContext;
    uri: AtUri;
  }): Promise<Profile | null> {
    return this.profiles.get(uri.toString()) ?? null;
  }

  async save(params: {
    ctx: TransactionContext;
    profile: Profile;
  }): Promise<void> {
    this.profiles.set(params.profile.uri, params.profile);
  }

  findAll(): Profile[] {
    return Array.from(this.profiles.values());
  }
}

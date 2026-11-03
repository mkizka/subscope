import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";

import type { IProfileRepository } from "../../../application/interfaces/repositories/profile-repository.js";
import type { ProfileRow } from "../../../application/record-parsers.js";

export class InMemoryProfileRepository implements IProfileRepository {
  private profiles: Map<string, ProfileRow> = new Map();

  add(profile: ProfileRow): void {
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
  }): Promise<ProfileRow | null> {
    return this.profiles.get(uri.toString()) ?? null;
  }

  async save(params: {
    ctx: TransactionContext;
    profile: ProfileRow;
  }): Promise<void> {
    this.profiles.set(params.profile.uri, params.profile);
  }

  findAll(): ProfileRow[] {
    return Array.from(this.profiles.values());
  }
}

import type { Did } from "@atproto/did";
import type { Profile, TransactionContext } from "@repo/common/domain";

import type { IProfileRepository } from "../../../application/interfaces/repositories/profile-repository.js";

export class InMemoryProfileRepository implements IProfileRepository {
  private profiles: Map<string, Profile> = new Map();

  add(profile: Profile): void {
    this.profiles.set(profile.uri.toString(), profile);
  }

  clear(): void {
    this.profiles.clear();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async upsert(params: {
    ctx: TransactionContext;
    profile: Profile;
  }): Promise<void> {
    this.profiles.set(params.profile.uri.toString(), params.profile);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async exists(params: {
    ctx: TransactionContext;
    actorDid: Did;
  }): Promise<boolean> {
    return Array.from(this.profiles.values()).some(
      (profile) => profile.actorDid === params.actorDid,
    );
  }
}

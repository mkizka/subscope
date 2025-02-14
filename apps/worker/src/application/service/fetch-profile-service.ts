import type { Did } from "@atproto/did";
import type { TransactionContext } from "@dawn/common/domain";

import type { IProfileFetcher } from "../interfaces/profile-fetcher.js";
import type { IProfileRepository } from "../interfaces/profile-repository.js";

export class FetchProfileService {
  constructor(
    private readonly profileFetcher: IProfileFetcher,
    private readonly profileRepository: IProfileRepository,
  ) {}
  static inject = ["profileFetcher", "profileRepository"] as const;

  async fetchAndCreateIfNotExists({
    ctx,
    did,
  }: {
    ctx: TransactionContext;
    did: Did;
  }) {
    const exists = await this.profileRepository.exists({ ctx, did });
    if (exists) {
      return;
    }
    const profile = await this.profileFetcher.fetch(did);
    if (profile) {
      await this.profileRepository.upsert({ ctx, profile });
    }
  }
}

import type { Did } from "@atproto/did";

import type { IDidResolver } from "../domain/interfaces/did-resolver.js";
import type { ITransactionManager } from "../domain/interfaces/transaction.js";
import { Profile } from "../domain/profile/profile.js";
import type { IProfileRepository } from "../domain/profile/profile-repository.js";
import { User } from "../domain/user/user.js";
import type { IUserRepository } from "../domain/user/user-repository.js";

export class SyncProfileUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly userRepository: IUserRepository,
    private readonly profileRepository: IProfileRepository,
    private readonly didResolver: IDidResolver,
  ) {}
  static inject = [
    "transactionManager",
    "userRepository",
    "profileRepository",
    "didResolver",
  ] as const;

  async execute(dto: {
    did: Did;
    avatar?: {
      cid: string;
      mimeType: string;
      size: number;
    };
    description?: string;
    displayName?: string;
  }) {
    await this.transactionManager.transaction(async (ctx) => {
      const user = await this.userRepository.findOne({ ctx, did: dto.did });
      if (!user) {
        const { handle } = await this.didResolver.resolve(dto.did);
        const newUser = new User({ did: dto.did, handle });
        await this.userRepository.createOrUpdate({ ctx, user: newUser });
      }
      const profile = new Profile(dto);
      await this.profileRepository.createOrUpdate({ ctx, profile });
    });
  }
}

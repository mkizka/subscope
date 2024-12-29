import type { Did } from "@atproto/did";

import { Profile } from "../domain/models/profile.js";
import { User } from "../domain/models/user.js";
import type { IDidResolver } from "../domain/repositories/did-resolver.js";
import type { IProfileRepository } from "../domain/repositories/profile.js";
import type { ITransactionManager } from "../domain/repositories/transaction-manager.js";
import type { IUserRepository } from "../domain/repositories/user.js";
import { createLogger } from "../shared/logger.js";

const logger = createLogger("SyncProfileUseCase");

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
    avatar?: string;
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

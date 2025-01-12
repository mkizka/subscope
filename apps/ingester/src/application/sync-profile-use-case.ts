import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@dawn/common/domain";
import { Profile, User } from "@dawn/common/domain";

import type { IDidResolver } from "./interfaces/did-resolver.js";
import type { IProfileRepository } from "./interfaces/profile-repository.js";
import type { IUserRepository } from "./interfaces/user-repository.js";

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
    avatar: {
      cid: string;
      mimeType: string;
      size: number;
    } | null;
    description: string | null;
    displayName: string | null;
    createdAt: string | null;
  }) {
    await this.transactionManager.transaction(async (ctx) => {
      const user = await this.userRepository.findOne({ ctx, did: dto.did });
      if (!user) {
        const data = await this.didResolver.resolve(dto.did);
        const newUser = new User({ did: dto.did, handle: data?.handle });
        await this.userRepository.createOrUpdate({ ctx, user: newUser });
      }
      const profile = new Profile(dto);
      await this.profileRepository.createOrUpdate({ ctx, profile });
    });
  }
}

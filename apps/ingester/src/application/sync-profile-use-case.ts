import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@dawn/common/domain";
import { Actor, Profile } from "@dawn/common/domain";

import type { IActorRepository } from "./interfaces/actor-repository.js";
import type { IDidResolver } from "./interfaces/did-resolver.js";
import type { IProfileRepository } from "./interfaces/profile-repository.js";

export class SyncProfileUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly actorRepository: IActorRepository,
    private readonly profileRepository: IProfileRepository,
    private readonly didResolver: IDidResolver,
  ) {}
  static inject = [
    "transactionManager",
    "actorRepository",
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
      const actor = await this.actorRepository.findOne({ ctx, did: dto.did });
      if (!actor) {
        const data = await this.didResolver.resolve(dto.did);
        const newActor = new Actor({ did: dto.did, handle: data?.handle });
        await this.actorRepository.createOrUpdate({ ctx, actor: newActor });
      }
      const profile = new Profile(dto);
      await this.profileRepository.createOrUpdate({ ctx, profile });
    });
  }
}

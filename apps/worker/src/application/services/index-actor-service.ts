import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import { Actor, type TransactionContext } from "@repo/common/domain";
import type { IJobScheduler } from "@repo/common/infrastructure";
import type { Handle } from "@repo/common/utils";

import type { IActorRepository } from "../interfaces/repositories/actor-repository.js";
import type { IProfileRepository } from "../interfaces/repositories/profile-repository.js";

export class IndexActorService {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly profileRepository: IProfileRepository,
    private readonly jobScheduler: IJobScheduler,
  ) {}
  static inject = [
    "actorRepository",
    "profileRepository",
    "jobScheduler",
  ] as const;

  async upsert({
    ctx,
    did,
    handle,
    live,
  }: {
    ctx: TransactionContext;
    did: Did;
    handle?: Handle;
    live: boolean;
  }): Promise<void> {
    const existingActor = await this.actorRepository.findByDid({ ctx, did });
    const actor = existingActor ?? Actor.create({ did });

    if (handle) {
      actor.updateHandle(handle);
    }

    await this.actorRepository.upsert({ ctx, actor });

    if (!actor.handle) {
      await this.jobScheduler.scheduleResolveDid(did);
    }

    const profileExists = await this.profileRepository.exists({
      ctx,
      actorDid: did,
    });
    if (!profileExists) {
      const profileUri = AtUri.make(did, "app.bsky.actor.profile", "self");
      await this.jobScheduler.scheduleFetchRecord(profileUri, {
        live,
        depth: 0,
      });
    }
  }

  async delete({
    ctx,
    did,
  }: {
    ctx: TransactionContext;
    did: Did;
  }): Promise<void> {
    await this.actorRepository.delete({ ctx, did });
  }
}

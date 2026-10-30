import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import {
  Actor,
  type ActorStatus,
  type AfterCommitContext,
  type IJobScheduler,
  type TransactionContext,
} from "@repo/common/domain";
import type { Handle } from "@repo/common/utils";

import type { IActorRepository } from "../interfaces/repositories/actor-repository.js";
import type { IProfileRepository } from "../interfaces/repositories/profile-repository.js";

export class IndexActorService {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly profileRepository: IProfileRepository,
    private readonly jobScheduler: IJobScheduler,
  ) {}

  async upsert({
    ctx,
    did,
    handle,
    status,
    live,
  }: {
    ctx: AfterCommitContext;
    did: Did;
    handle?: Handle;
    status?: ActorStatus;
    live: boolean;
  }): Promise<void> {
    const existingActor = await this.actorRepository.findByDid({ ctx, did });
    const actor = existingActor ?? Actor.create({ did });

    if (handle) {
      actor.updateHandle(handle);
    }
    if (status) {
      actor.updateStatus(status);
    }

    await this.actorRepository.upsert({ ctx, actor });

    if (!actor.handle) {
      ctx.afterCommit(() => this.jobScheduler.scheduleResolveDid(did));
    }

    const profileExists = await this.profileRepository.exists({
      ctx,
      actorDid: did,
    });
    if (!profileExists) {
      const profileUri = AtUri.make(did, "app.bsky.actor.profile", "self");
      ctx.afterCommit(() =>
        this.jobScheduler.scheduleFetchRecord(profileUri, {
          live,
          depth: 0,
        }),
      );
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

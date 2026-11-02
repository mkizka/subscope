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

import type { IProfileQuery } from "../interfaces/queries/profile-query.js";
import type { IActorRepository } from "../interfaces/repositories/actor-repository.js";

export class IndexActorService {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly profileQuery: IProfileQuery,
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
    const existingActor = await this.actorRepository.find({ ctx, did });
    const actor = existingActor ?? Actor.create({ did });
    const changed =
      !existingActor ||
      (!!handle && handle !== actor.handle) ||
      (!!status && status !== actor.status);

    if (handle) {
      actor.updateHandle(handle);
    }
    if (status) {
      actor.updateStatus(status);
    }

    if (changed) {
      await this.actorRepository.save({ ctx, actor });
    }

    if (!actor.handle) {
      ctx.afterCommit(() =>
        this.jobScheduler.scheduleResolveDid(did, { live }),
      );
    }

    const profileExists = await this.profileQuery.exists({
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

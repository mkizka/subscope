import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import {
  Actor,
  type AfterCommitContext,
  type IJobScheduler,
} from "@repo/common/domain";

import type { IActorRepository } from "../../../application/interfaces/actor-repository.js";

export class CreateAdminService {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly jobScheduler: IJobScheduler,
  ) {}

  async execute({
    ctx,
    did,
  }: {
    ctx: AfterCommitContext;
    did: Did;
  }): Promise<void> {
    const existingActor = await this.actorRepository.findByDid(did);
    const actor = existingActor ?? Actor.create({ did });
    actor.promoteToAdmin();
    await this.actorRepository.upsert({ ctx, actor });

    if (!actor.handle) {
      ctx.afterCommit(() =>
        this.jobScheduler.scheduleResolveDid(did, { live: true }),
      );
    }

    const profileUri = AtUri.make(did, "app.bsky.actor.profile", "self");
    ctx.afterCommit(() =>
      this.jobScheduler.scheduleFetchRecord(profileUri, {
        live: true,
        depth: 0,
      }),
    );
  }
}

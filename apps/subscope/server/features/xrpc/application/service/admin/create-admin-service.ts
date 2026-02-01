import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import {
  Actor,
  type IJobScheduler,
  type TransactionContext,
} from "@repo/common/domain";

import type { IActorRepository } from "@/server/features/xrpc/application/interfaces/actor-repository.js";

export class CreateAdminService {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly jobScheduler: IJobScheduler,
  ) {}
  static inject = ["actorRepository", "jobScheduler"] as const;

  async execute({
    ctx,
    did,
  }: {
    ctx: TransactionContext;
    did: Did;
  }): Promise<void> {
    const actor = Actor.create({ did });
    actor.promoteToAdmin();
    await this.actorRepository.upsert({ ctx, actor });

    await this.jobScheduler.scheduleResolveDid(did);

    const profileUri = AtUri.make(did, "app.bsky.actor.profile", "self");
    await this.jobScheduler.scheduleFetchRecord(profileUri, {
      live: true,
      depth: 0,
    });
  }
}

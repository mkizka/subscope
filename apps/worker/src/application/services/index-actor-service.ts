import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import { Actor, type TransactionContext } from "@repo/common/domain";
import type { Handle } from "@repo/common/utils";

import type { IActorRepository } from "../interfaces/repositories/actor-repository.js";
import type { IProfileRepository } from "../interfaces/repositories/profile-repository.js";
import type { IndexingContext } from "../interfaces/services/index-collection-service.js";
import type { FetchRecordScheduler } from "./scheduler/fetch-record-scheduler.js";
import type { ResolveDidScheduler } from "./scheduler/resolve-did-scheduler.js";

export class IndexActorService {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly profileRepository: IProfileRepository,
    private readonly fetchRecordScheduler: FetchRecordScheduler,
    private readonly resolveDidScheduler: ResolveDidScheduler,
  ) {}
  static inject = [
    "actorRepository",
    "profileRepository",
    "fetchRecordScheduler",
    "resolveDidScheduler",
  ] as const;

  async upsert({
    ctx,
    did,
    handle,
    indexingCtx,
  }: {
    ctx: TransactionContext;
    did: Did;
    handle?: Handle;
    indexingCtx: IndexingContext;
  }): Promise<void> {
    const existingActor = await this.actorRepository.findByDid({ ctx, did });
    const actor = existingActor ?? Actor.create({ did });

    if (handle) {
      actor.updateHandle(handle);
    }

    await this.actorRepository.upsert({ ctx, actor });

    if (!actor.handle) {
      await this.resolveDidScheduler.schedule(did);
    }

    const profileExists = await this.profileRepository.exists({
      ctx,
      actorDid: did,
    });
    if (!profileExists) {
      const profileUri = AtUri.make(did, "app.bsky.actor.profile", "self");
      await this.fetchRecordScheduler.schedule(profileUri, indexingCtx);
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

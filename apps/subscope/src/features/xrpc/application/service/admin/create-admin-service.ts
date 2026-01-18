import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import { Actor, type TransactionContext } from "@repo/common/domain";

import type { IActorRepository } from "../../interfaces/actor-repository.js";
import type { FetchRecordScheduler } from "../scheduler/fetch-record-scheduler.js";

export class CreateAdminService {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly fetchRecordScheduler: FetchRecordScheduler,
  ) {}
  static inject = ["actorRepository", "fetchRecordScheduler"] as const;

  async execute({
    ctx,
    did,
  }: {
    ctx: TransactionContext;
    did: Did;
  }): Promise<void> {
    const existingActor = await this.actorRepository.findByDid(did);
    const actor = existingActor ?? Actor.create({ did });

    if (!existingActor) {
      const profileUri = AtUri.make(did, "app.bsky.actor.profile", "self");
      await this.fetchRecordScheduler.schedule(profileUri, {
        live: false,
        depth: 0,
      });
    }

    actor.promoteToAdmin();
    await this.actorRepository.upsert({ ctx, actor });
  }
}

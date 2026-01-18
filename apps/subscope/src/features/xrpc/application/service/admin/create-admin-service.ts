import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import { Actor, type TransactionContext } from "@repo/common/domain";

import type { IActorRepository } from "../../interfaces/actor-repository.js";
import type { FetchRecordScheduler } from "../scheduler/fetch-record-scheduler.js";
import type { ResolveDidScheduler } from "../scheduler/resolve-did-scheduler.js";

export class CreateAdminService {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly fetchRecordScheduler: FetchRecordScheduler,
    private readonly resolveDidScheduler: ResolveDidScheduler,
  ) {}
  static inject = [
    "actorRepository",
    "fetchRecordScheduler",
    "resolveDidScheduler",
  ] as const;

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

    await this.resolveDidScheduler.schedule(did);

    const profileUri = AtUri.make(did, "app.bsky.actor.profile", "self");
    await this.fetchRecordScheduler.schedule(profileUri, {
      live: true,
      depth: 0,
    });
  }
}

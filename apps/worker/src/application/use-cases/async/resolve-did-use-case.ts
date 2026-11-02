import type { Did } from "@atproto/did";
import type { IDidResolver } from "@repo/common/domain";
import { Actor, type DatabaseClient } from "@repo/common/domain";

import type { IHandleResolver } from "../../interfaces/external/handle-resolver.js";
import type { IActorRepository } from "../../interfaces/repositories/actor-repository.js";

export class ResolveDidUseCase {
  constructor(
    private readonly didResolver: IDidResolver,
    private readonly handleResolver: IHandleResolver,
    private readonly actorRepository: IActorRepository,
    private readonly db: DatabaseClient,
  ) {}

  async execute(did: Did) {
    const existingActor = await this.actorRepository.find({
      ctx: { db: this.db },
      did,
    });
    if (existingActor?.handle && existingActor.handle !== "handle.invalid") {
      return;
    }

    const { handle } = await this.didResolver.resolve(did);
    const resolvedDid = await this.handleResolver.resolve(handle);

    const actor = existingActor ?? Actor.create({ did });
    actor.updateHandle(resolvedDid === did ? handle : "handle.invalid");

    await this.actorRepository.save({
      ctx: { db: this.db },
      actor,
    });
  }
}

import type { Did } from "@atproto/did";
import type { IDidResolver } from "@repo/common/domain";
import { Actor, type ITransactionManager } from "@repo/common/domain";

import type { IHandleResolver } from "../../interfaces/external/handle-resolver.js";
import type { IActorRepository } from "../../interfaces/repositories/actor-repository.js";

export class ResolveDidUseCase {
  constructor(
    private readonly didResolver: IDidResolver,
    private readonly handleResolver: IHandleResolver,
    private readonly actorRepository: IActorRepository,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute(did: Did) {
    const existingActor = await this.transactionManager.transaction((ctx) =>
      this.actorRepository.find({ ctx, did }),
    );
    if (existingActor?.handle && existingActor.handle !== "handle.invalid") {
      return;
    }

    const { handle } = await this.didResolver.resolve(did);
    const resolvedDid = await this.handleResolver.resolve(handle);

    const actor = existingActor ?? Actor.create({ did });
    actor.updateHandle(resolvedDid === did ? handle : "handle.invalid");

    await this.transactionManager.transaction((ctx) =>
      this.actorRepository.save({ ctx, actor }),
    );
  }
}

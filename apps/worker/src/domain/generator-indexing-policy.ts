import type { TransactionContext } from "@repo/common/domain";
import type { Generator } from "@repo/common/domain";

import type { ITrackedActorRepository } from "../application/interfaces/repositories/tracked-actor-repository.js";

export class GeneratorIndexingPolicy {
  constructor(
    private readonly trackedActorRepository: ITrackedActorRepository,
  ) {}
  static inject = ["trackedActorRepository"] as const;

  async shouldIndex(
    ctx: TransactionContext,
    generator: Generator,
  ): Promise<boolean> {
    return this.trackedActorRepository.isTrackedActor(ctx, generator.actorDid);
  }
}

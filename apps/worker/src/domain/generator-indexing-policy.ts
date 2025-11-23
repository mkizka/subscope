import type { TransactionContext } from "@repo/common/domain";
import type { Generator } from "@repo/common/domain";

import type { ITrackedActorChecker } from "../application/interfaces/repositories/tracked-actor-checker.js";

export class GeneratorIndexingPolicy {
  constructor(private readonly trackedActorChecker: ITrackedActorChecker) {}
  static inject = ["trackedActorChecker"] as const;

  async shouldIndex(
    ctx: TransactionContext,
    generator: Generator,
  ): Promise<boolean> {
    return this.trackedActorChecker.isTrackedActor(ctx, generator.actorDid);
  }
}

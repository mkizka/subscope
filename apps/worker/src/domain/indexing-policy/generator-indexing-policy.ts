import type { Generator, IIndexTargetRepository } from "@repo/common/domain";

export class GeneratorIndexingPolicy {
  constructor(private readonly indexTargetRepository: IIndexTargetRepository) {}
  static inject = ["indexTargetRepository"] as const;

  async shouldIndex(generator: Generator): Promise<boolean> {
    return this.indexTargetRepository.isTrackedActor(generator.actorDid);
  }
}

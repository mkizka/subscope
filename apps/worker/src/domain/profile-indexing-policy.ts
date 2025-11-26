import type { IIndexTargetRepository, Profile } from "@repo/common/domain";

export class ProfileIndexingPolicy {
  constructor(private readonly indexTargetRepository: IIndexTargetRepository) {}
  static inject = ["indexTargetRepository"] as const;

  async shouldIndex(profile: Profile): Promise<boolean> {
    return this.indexTargetRepository.isTrackedActor(profile.actorDid);
  }
}

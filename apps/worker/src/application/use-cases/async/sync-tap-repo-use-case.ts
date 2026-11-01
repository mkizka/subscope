import type { Did } from "@atproto/did";
import type {
  DatabaseClient,
  IJobScheduler,
  ITapClient,
} from "@repo/common/domain";

import type { ILabelFetcher } from "../../interfaces/external/label-fetcher.js";
import type { IFollowRepository } from "../../interfaces/repositories/follow-repository.js";
import type { ISubscriptionRepository } from "../../interfaces/repositories/subscription-repository.js";
import type { IndexLabelUseCase } from "../label/index-label-use-case.js";

export class SyncTapRepoUseCase {
  constructor(
    private readonly tapClient: ITapClient,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly followRepository: IFollowRepository,
    private readonly labelFetcher: ILabelFetcher,
    private readonly indexLabelUseCase: IndexLabelUseCase,
    private readonly jobScheduler: IJobScheduler,
    private readonly db: DatabaseClient,
  ) {}

  async execute(did: Did) {
    const ctx = { db: this.db };
    const isTrackedActor =
      (await this.subscriptionRepository.isSubscriber(ctx, did)) ||
      (await this.followRepository.isFollowedByAnySubscriber({
        ctx,
        subjectDid: did,
      }));
    if (isTrackedActor) {
      await this.tapClient.addRepo(did);
      await this.jobScheduler.scheduleCheckBackfill(did, 0);
      for (const label of await this.labelFetcher.fetchByActor(did)) {
        await this.indexLabelUseCase.execute(label);
      }
    } else {
      await this.tapClient.removeRepo(did);
    }
  }
}

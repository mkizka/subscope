import type { Did } from "@atproto/did";
import type {
  IJobScheduler,
  ITapClient,
  ITransactionManager,
} from "@repo/common/domain";

import type { ILabelFetcher } from "../../interfaces/external/label-fetcher.js";
import type { ISubscriptionQuery } from "../../interfaces/queries/subscription-query.js";
import type { IndexLabelUseCase } from "../label/index-label-use-case.js";

export class SyncTapRepoUseCase {
  constructor(
    private readonly tapClient: ITapClient,
    private readonly subscriptionQuery: ISubscriptionQuery,
    private readonly labelFetcher: ILabelFetcher,
    private readonly indexLabelUseCase: IndexLabelUseCase,
    private readonly jobScheduler: IJobScheduler,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute(did: Did) {
    const isTrackedActor = await this.transactionManager.transaction(
      async (ctx) =>
        (await this.subscriptionQuery.isSubscriber(ctx, did)) ||
        (await this.subscriptionQuery.isFollowedByAnySubscriber(ctx, did)),
    );
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

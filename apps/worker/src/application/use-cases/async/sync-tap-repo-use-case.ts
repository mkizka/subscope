import type { Did } from "@atproto/did";
import type {
  IJobScheduler,
  ITransactionManager,
} from "@repo/common/interface";

import type { ILabelFetcher } from "../../interfaces/external/label-fetcher.js";
import type { IRegistrationQuery } from "../../interfaces/queries/registration-query.js";
import type { IndexLabelService } from "../../services/index-label-service.js";
import type { TrackingService } from "../../services/tracking-service.js";

export class SyncTapRepoUseCase {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly registrationQuery: IRegistrationQuery,
    private readonly labelFetcher: ILabelFetcher,
    private readonly indexLabelService: IndexLabelService,
    private readonly jobScheduler: IJobScheduler,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute(did: Did) {
    if (await this.shouldTrack(did)) {
      await this.startTracking(did);
    } else {
      await this.trackingService.stop(did);
    }
  }

  private async shouldTrack(did: Did) {
    return await this.transactionManager.transaction(
      async (ctx) =>
        (await this.registrationQuery.isRegistered(ctx, did)) ||
        (await this.registrationQuery.isFollowedByAnyServerMember(ctx, did)),
    );
  }

  private async startTracking(did: Did) {
    await this.trackingService.start(did);
    await this.jobScheduler.scheduleCheckBackfill(did, 0);
    for (const label of await this.labelFetcher.fetchByAccount(did)) {
      await this.transactionManager.transaction((ctx) =>
        this.indexLabelService.index({ ctx, label }),
      );
    }
  }
}

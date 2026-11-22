import type { Did } from "@atproto/did";
import type {
  IJobScheduler,
  ITransactionManager,
  TransactionContext,
} from "@repo/common/interface";

import type { ILabelFetcher } from "../../interfaces/external/label-fetcher.js";
import type { ITapClient } from "../../interfaces/external/tap-client.js";
import type { IRegistrationQuery } from "../../interfaces/queries/registration-query.js";
import type { ITrackingRepository } from "../../interfaces/repositories/tracking-repository.js";
import type { IndexLabelService } from "../../services/index-label-service.js";

export class SyncTapRepoUseCase {
  constructor(
    private readonly tapClient: ITapClient,
    private readonly registrationQuery: IRegistrationQuery,
    private readonly trackingRepository: ITrackingRepository,
    private readonly labelFetcher: ILabelFetcher,
    private readonly indexLabelService: IndexLabelService,
    private readonly jobScheduler: IJobScheduler,
    private readonly transactionManager: ITransactionManager,
  ) {}

  private async updateTracking(ctx: TransactionContext, did: Did) {
    const isRegistered = await this.registrationQuery.isRegistered(ctx, did);
    const isTracked =
      isRegistered ||
      (await this.registrationQuery.isFollowedByAnyServerMember(ctx, did));
    if (!isTracked) {
      await this.trackingRepository.delete({ ctx, did });
      return false;
    }
    const tracking = await this.trackingRepository.find({ ctx, did });
    if (!tracking) {
      await this.trackingRepository.save({
        ctx,
        tracking: { did, trackedAt: new Date() },
      });
    }
    return true;
  }

  async execute(did: Did) {
    const isTrackedAccount = await this.transactionManager.transaction((ctx) =>
      this.updateTracking(ctx, did),
    );
    if (isTrackedAccount) {
      await this.tapClient.addRepo(did);
      await this.jobScheduler.scheduleCheckBackfill(did, 0);
      for (const label of await this.labelFetcher.fetchByAccount(did)) {
        await this.transactionManager.transaction((ctx) =>
          this.indexLabelService.index({ ctx, label }),
        );
      }
    } else {
      await this.tapClient.removeRepo(did);
    }
  }
}

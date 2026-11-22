import type { Did } from "@atproto/did";
import type {
  IJobScheduler,
  ITransactionManager,
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

  async execute(did: Did) {
    if (await this.shouldTrack(did)) {
      await this.startTracking(did);
    } else {
      await this.stopTracking(did);
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
    await this.transactionManager.transaction(async (ctx) => {
      const tracking = await this.trackingRepository.find({ ctx, did });
      if (!tracking) {
        await this.trackingRepository.save({
          ctx,
          tracking: { did, trackedAt: new Date() },
        });
      }
    });
    await this.tapClient.addRepo(did);
    await this.jobScheduler.scheduleCheckBackfill(did, 0);
    for (const label of await this.labelFetcher.fetchByAccount(did)) {
      await this.transactionManager.transaction((ctx) =>
        this.indexLabelService.index({ ctx, label }),
      );
    }
  }

  private async stopTracking(did: Did) {
    await this.transactionManager.transaction((ctx) =>
      this.trackingRepository.delete({ ctx, did }),
    );
    await this.tapClient.removeRepo(did);
  }
}

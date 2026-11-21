import type { Did } from "@atproto/did";
import type {
  IJobScheduler,
  ITransactionManager,
} from "@repo/common/interface";

import { Tracking } from "../../../domain/tracking.js";
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
    const isTrackedAccount = await this.transactionManager.transaction(
      async (ctx) =>
        (await this.registrationQuery.isRegistered(ctx, did)) ||
        (await this.registrationQuery.isFollowedByAnyServerMember(ctx, did)),
    );
    if (isTrackedAccount) {
      await this.transactionManager.transaction(async (ctx) => {
        if (!(await this.trackingRepository.find({ ctx, did }))) {
          await this.trackingRepository.save({
            ctx,
            tracking: Tracking.create(did),
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
    } else {
      await this.tapClient.removeRepo(did);
      await this.transactionManager.transaction((ctx) =>
        this.trackingRepository.delete({ ctx, did }),
      );
    }
  }
}

import type { Did } from "@atproto/did";
import type {
  IJobScheduler,
  ITransactionManager,
} from "@repo/common/interface";

import type { ITrackingRepository } from "../../domain/interfaces/tracking-repository.js";
import { Tracking } from "../../domain/tracking.js";
import type { ILabelFetcher } from "../interfaces/external/label-fetcher.js";
import type { ITapClient } from "../interfaces/external/tap-client.js";
import type { IndexLabelService } from "./index-label-service.js";

export class TrackingService {
  constructor(
    private readonly tapClient: ITapClient,
    private readonly trackingRepository: ITrackingRepository,
    private readonly labelFetcher: ILabelFetcher,
    private readonly indexLabelService: IndexLabelService,
    private readonly jobScheduler: IJobScheduler,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async start(did: Did) {
    await this.transactionManager.transaction(async (ctx) => {
      const tracking = await this.trackingRepository.find({ ctx, did });
      if (!tracking) {
        await this.trackingRepository.save({
          ctx,
          tracking: Tracking.start(did),
        });
      }
    });
    await this.tapClient.addRepo(did);
    await this.jobScheduler.scheduleCheckBackfill(did, 0);
    const labels = await this.labelFetcher.fetchByAccount(did);
    await this.transactionManager.transaction(async (ctx) => {
      for (const label of labels) {
        await this.indexLabelService.index({ ctx, label });
      }
    });
  }

  async stop(did: Did) {
    await this.transactionManager.transaction((ctx) =>
      this.trackingRepository.delete({ ctx, did }),
    );
    await this.tapClient.removeRepo(did);
  }
}

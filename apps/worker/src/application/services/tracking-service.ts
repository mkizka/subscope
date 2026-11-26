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
    private readonly deps: {
      tapClient: ITapClient;
      trackingRepository: ITrackingRepository;
      labelFetcher: ILabelFetcher;
      indexLabelService: IndexLabelService;
      jobScheduler: IJobScheduler;
      transactionManager: ITransactionManager;
    },
  ) {}

  async start(did: Did) {
    await this.deps.transactionManager.transaction(async (ctx) => {
      const tracking = await this.deps.trackingRepository.find({ ctx, did });
      if (!tracking) {
        await this.deps.trackingRepository.save({
          ctx,
          tracking: Tracking.start(did),
        });
      }
    });
    await this.deps.tapClient.addRepo(did);
    await this.deps.jobScheduler.scheduleCheckBackfill(did, 0);
    const labels = await this.deps.labelFetcher.fetchByAccount(did);
    await this.deps.transactionManager.transaction(async (ctx) => {
      for (const label of labels) {
        await this.deps.indexLabelService.index({ ctx, label });
      }
    });
  }

  async stop(did: Did) {
    await this.deps.transactionManager.transaction((ctx) =>
      this.deps.trackingRepository.delete({ ctx, did }),
    );
    await this.deps.tapClient.removeRepo(did);
  }
}

import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@repo/common/interface";

import type { ITapClient } from "../interfaces/external/tap-client.js";
import type { ITrackingRepository } from "../interfaces/repositories/tracking-repository.js";

export class TrackingService {
  constructor(
    private readonly tapClient: ITapClient,
    private readonly trackingRepository: ITrackingRepository,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async start(did: Did) {
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
  }

  async stop(did: Did) {
    await this.transactionManager.transaction((ctx) =>
      this.trackingRepository.delete({ ctx, did }),
    );
    await this.tapClient.removeRepo(did);
  }
}

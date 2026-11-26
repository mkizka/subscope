import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@repo/common/interface";

import type { StoragePolicy } from "../../../domain/services/storage-policy.js";
import type { TrackingService } from "../../services/tracking-service.js";

export class SyncTapRepoUseCase {
  constructor(
    private readonly deps: {
      trackingService: TrackingService;
      storagePolicy: StoragePolicy;
      transactionManager: ITransactionManager;
    },
  ) {}

  async execute({ did, refetch }: { did: Did; refetch?: boolean }) {
    if (refetch) {
      await this.deps.trackingService.stop(did);
    }
    const shouldTrack = await this.deps.transactionManager.transaction((ctx) =>
      this.deps.storagePolicy.isTracked(ctx, did),
    );
    if (shouldTrack) {
      await this.deps.trackingService.start(did);
    } else {
      await this.deps.trackingService.stop(did);
    }
  }
}

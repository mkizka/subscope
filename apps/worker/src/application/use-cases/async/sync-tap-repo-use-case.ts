import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@repo/common/interface";

import type { StoragePolicy } from "../../../domain/services/storage-policy.js";
import type { TrackingService } from "../../services/tracking-service.js";

export class SyncTapRepoUseCase {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly storagePolicy: StoragePolicy,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute({ did, refetch }: { did: Did; refetch?: boolean }) {
    if (refetch) {
      await this.trackingService.stop(did);
    }
    const shouldTrack = await this.transactionManager.transaction((ctx) =>
      this.storagePolicy.isTracked(ctx, did),
    );
    if (shouldTrack) {
      await this.trackingService.start(did);
    } else {
      await this.trackingService.stop(did);
    }
  }
}

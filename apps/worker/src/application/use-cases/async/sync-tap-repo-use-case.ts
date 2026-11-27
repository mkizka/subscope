import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@repo/common/interface";

import type { AccountRoster } from "../../../domain/account-roster.js";
import type { StoragePolicy } from "../../../domain/services/storage-policy.js";
import type { TrackingService } from "../../services/tracking-service.js";

export class SyncTapRepoUseCase {
  constructor(
    private readonly deps: {
      trackingService: TrackingService;
      storagePolicy: StoragePolicy;
      transactionManager: ITransactionManager;
      accountRoster: AccountRoster;
    },
  ) {}

  async execute({ did, refetch }: { did: Did; refetch?: boolean }) {
    if (refetch) {
      await this.deps.trackingService.stop(did);
    }
    const kind = await this.deps.transactionManager.transaction((ctx) =>
      this.deps.storagePolicy.classify(ctx, did),
    );
    if (kind.usesTap) {
      this.deps.accountRoster.set(did, kind);
      await this.deps.trackingService.start(did);
    } else {
      await this.deps.trackingService.stop(did);
      this.deps.accountRoster.set(did, kind);
    }
  }
}

import type {
  IJobScheduler,
  ITransactionManager,
  JobData,
} from "@repo/common/interface";

import type { StoragePolicy } from "../../../domain/services/storage-policy.js";
import type { IRepoStatusFetcher } from "../../interfaces/external/repo-status-fetcher.js";
import type { ITapClient } from "../../interfaces/external/tap-client.js";
import type { IAccountRepository } from "../../interfaces/repositories/account-repository.js";
import type { TrackingService } from "../../services/tracking-service.js";

export class CheckBackfillUseCase {
  constructor(
    private readonly deps: {
      tapClient: ITapClient;
      repoStatusFetcher: IRepoStatusFetcher;
      trackingService: TrackingService;
      storagePolicy: StoragePolicy;
      accountRepository: IAccountRepository;
      jobScheduler: IJobScheduler;
      transactionManager: ITransactionManager;
    },
  ) {}

  async execute({ did, attempt }: JobData["checkBackfill"]) {
    const account = await this.deps.transactionManager.transaction(
      async (ctx) => {
        const isTracked = await this.deps.storagePolicy.isTracked(ctx, did);
        return isTracked
          ? this.deps.accountRepository.find({ ctx, did })
          : null;
      },
    );
    if (!account) {
      return;
    }
    const tapState = await this.deps.tapClient.getRepoState(did);
    const isDeleted =
      tapState === "error" &&
      (await this.deps.repoStatusFetcher.isDeleted(did));
    if (isDeleted) {
      await this.deps.trackingService.stop(did);
      account.completeBackfill();
      await this.deps.transactionManager.transaction((ctx) =>
        this.deps.accountRepository.save({ ctx, account }),
      );
      return;
    }
    account.applyTapState(tapState);
    await this.deps.transactionManager.transaction((ctx) =>
      this.deps.accountRepository.save({ ctx, account }),
    );
    if (account.needsBackfillRecheck) {
      await this.deps.jobScheduler.scheduleCheckBackfill(did, attempt + 1);
    }
  }
}

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
    private readonly tapClient: ITapClient,
    private readonly repoStatusFetcher: IRepoStatusFetcher,
    private readonly trackingService: TrackingService,
    private readonly storagePolicy: StoragePolicy,
    private readonly accountRepository: IAccountRepository,
    private readonly jobScheduler: IJobScheduler,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute({ did, attempt }: JobData["checkBackfill"]) {
    const account = await this.transactionManager.transaction(async (ctx) => {
      const isTracked = await this.storagePolicy.isTracked(ctx, did);
      return isTracked ? this.accountRepository.find({ ctx, did }) : null;
    });
    if (!account) {
      return;
    }
    const tapState = await this.tapClient.getRepoState(did);
    const isDeleted =
      tapState === "error" && (await this.repoStatusFetcher.isDeleted(did));
    if (isDeleted) {
      await this.trackingService.stop(did);
      account.completeBackfill();
      await this.transactionManager.transaction((ctx) =>
        this.accountRepository.save({ ctx, account }),
      );
      return;
    }
    account.applyTapState(tapState);
    await this.transactionManager.transaction((ctx) =>
      this.accountRepository.save({ ctx, account }),
    );
    if (account.needsBackfillRecheck) {
      await this.jobScheduler.scheduleCheckBackfill(did, attempt + 1);
    }
  }
}

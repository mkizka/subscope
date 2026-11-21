import type { Did } from "@atproto/did";
import type {
  IJobScheduler,
  ITransactionManager,
} from "@repo/common/interface";

import type { ILabelFetcher } from "../../interfaces/external/label-fetcher.js";
import type { ITapClient } from "../../interfaces/external/tap-client.js";
import type { IRegistrationQuery } from "../../interfaces/queries/registration-query.js";
import type { IndexLabelService } from "../../services/index-label-service.js";

export class SyncTapRepoUseCase {
  constructor(
    private readonly tapClient: ITapClient,
    private readonly registrationQuery: IRegistrationQuery,
    private readonly labelFetcher: ILabelFetcher,
    private readonly indexLabelService: IndexLabelService,
    private readonly jobScheduler: IJobScheduler,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute({ did, refetch }: { did: Did; refetch?: boolean }) {
    if (refetch) {
      await this.tapClient.removeRepo(did);
    }
    const isTrackedAccount = await this.transactionManager.transaction(
      async (ctx) =>
        (await this.registrationQuery.isRegistered(ctx, did)) ||
        (await this.registrationQuery.isFollowedByAnyServerMember(ctx, did)),
    );
    if (isTrackedAccount) {
      await this.tapClient.addRepo(did);
      await this.jobScheduler.scheduleCheckBackfill(did, 0);
      for (const label of await this.labelFetcher.fetchByAccount(did)) {
        await this.transactionManager.transaction((ctx) =>
          this.indexLabelService.index({ ctx, label }),
        );
      }
    } else {
      await this.tapClient.removeRepo(did);
    }
  }
}

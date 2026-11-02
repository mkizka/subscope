import type { Did } from "@atproto/did";
import type {
  IJobScheduler,
  ITapClient,
  ITransactionManager,
} from "@repo/common/domain";

import type { ILabelFetcher } from "../../interfaces/external/label-fetcher.js";
import type { IRegistrationQuery } from "../../interfaces/queries/registration-query.js";
import type { IndexLabelUseCase } from "../label/index-label-use-case.js";

export class SyncTapRepoUseCase {
  constructor(
    private readonly tapClient: ITapClient,
    private readonly registrationQuery: IRegistrationQuery,
    private readonly labelFetcher: ILabelFetcher,
    private readonly indexLabelUseCase: IndexLabelUseCase,
    private readonly jobScheduler: IJobScheduler,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute(did: Did) {
    const isTrackedAccount = await this.transactionManager.transaction(
      async (ctx) =>
        (await this.registrationQuery.isRegistered(ctx, did)) ||
        (await this.registrationQuery.isFollowedByAnyRegisteredAccount(
          ctx,
          did,
        )),
    );
    if (isTrackedAccount) {
      await this.tapClient.addRepo(did);
      await this.jobScheduler.scheduleCheckBackfill(did, 0);
      for (const label of await this.labelFetcher.fetchByAccount(did)) {
        await this.indexLabelUseCase.execute(label);
      }
    } else {
      await this.tapClient.removeRepo(did);
    }
  }
}

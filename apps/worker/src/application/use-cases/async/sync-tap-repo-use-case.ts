import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@repo/common/interface";

import type { IRegistrationQuery } from "../../interfaces/queries/registration-query.js";
import type { TrackingService } from "../../services/tracking-service.js";

export class SyncTapRepoUseCase {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly registrationQuery: IRegistrationQuery,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute(did: Did) {
    if (await this.shouldTrack(did)) {
      await this.trackingService.start(did);
    } else {
      await this.trackingService.stop(did);
    }
  }

  private async shouldTrack(did: Did) {
    return await this.transactionManager.transaction(
      async (ctx) =>
        (await this.registrationQuery.isRegistered(ctx, did)) ||
        (await this.registrationQuery.isFollowedByAnyServerMember(ctx, did)),
    );
  }
}

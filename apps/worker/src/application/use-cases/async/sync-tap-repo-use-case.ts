import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@repo/common/interface";

import type { IRegistrationQuery } from "../../../domain/interfaces/registration-query.js";
import type { TrackingService } from "../../services/tracking-service.js";

export class SyncTapRepoUseCase {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly registrationQuery: IRegistrationQuery,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute({ did, refetch }: { did: Did; refetch?: boolean }) {
    if (refetch) {
      await this.trackingService.stop(did);
    }
    const shouldTrack = await this.shouldTrack(did);
    if (shouldTrack) {
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

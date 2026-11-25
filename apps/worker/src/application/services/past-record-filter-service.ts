import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/interface";

import type { Origin } from "../../domain/origin.js";
import { Tracking } from "../../domain/tracking.js";
import type { IRegistrationQuery } from "../interfaces/queries/registration-query.js";
import type { ITrackingRepository } from "../interfaces/repositories/tracking-repository.js";

type Params = {
  ctx: TransactionContext;
  origin: Origin;
  did: Did;
  createdAt: Date;
};

export class PastRecordFilterService {
  constructor(
    private readonly registrationQuery: IRegistrationQuery,
    private readonly trackingRepository: ITrackingRepository,
  ) {}

  async accepts({ ctx, origin, did, createdAt }: Params) {
    if (!origin.isPast) {
      return true;
    }
    return Tracking.keepsPastRecord({
      authorIsMember: await this.registrationQuery.isRegistered(ctx, did),
      tracking: await this.trackingRepository.find({ ctx, did }),
      createdAt,
    });
  }

  async isWithinWindow({ ctx, origin, did, createdAt }: Params) {
    if (!origin.isPast) {
      return true;
    }
    const tracking = await this.trackingRepository.find({ ctx, did });
    return Tracking.windowCovers(tracking, createdAt);
  }
}

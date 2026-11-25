import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/interface";

import type { Origin } from "../../domain/origin.js";
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

  async accepts(params: Params) {
    return (
      !params.origin.isPast ||
      (await this.registrationQuery.isRegistered(params.ctx, params.did)) ||
      (await this.isWithinWindow(params))
    );
  }

  async isWithinWindow({ ctx, origin, did, createdAt }: Params) {
    if (!origin.isPast) {
      return true;
    }
    const tracking = await this.trackingRepository.find({ ctx, did });
    return !!tracking && tracking.covers(createdAt);
  }
}

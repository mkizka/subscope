import type { Did } from "@atproto/did";

import type { BackfillStatus } from "../../../domain/models/account.js";
import type { IRegistrationQuery } from "../../interfaces/queries/registration-query.js";

export class GetTrackingStatusesUseCase {
  constructor(private readonly registrationQuery: IRegistrationQuery) {}

  async execute(params: { dids: Did[] }): Promise<{
    statuses: { did: Did; isMember: boolean; backfillStatus: BackfillStatus }[];
  }> {
    const statuses = await this.registrationQuery.findTrackingStatuses(
      params.dids,
    );
    return { statuses };
  }
}

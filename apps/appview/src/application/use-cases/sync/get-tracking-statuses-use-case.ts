import type { Did } from "@atproto/did";

import type { BackfillStatus } from "../../../domain/models/account.js";
import type { ITrackingQuery } from "../../interfaces/queries/tracking-query.js";

export class GetTrackingStatusesUseCase {
  constructor(private readonly trackingQuery: ITrackingQuery) {}

  async execute(params: { dids: Did[] }): Promise<{
    statuses: { did: Did; backfillStatus: BackfillStatus }[];
  }> {
    const statuses = await this.trackingQuery.findStatuses(params.dids);
    return { statuses };
  }
}

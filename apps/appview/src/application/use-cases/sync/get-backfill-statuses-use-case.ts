import type { Did } from "@atproto/did";

import type { BackfillStatus } from "../../../domain/models/account.js";
import type { IBackfillStatusQuery } from "../../interfaces/queries/backfill-status-query.js";

export class GetBackfillStatusesUseCase {
  constructor(private readonly backfillStatusQuery: IBackfillStatusQuery) {}

  async execute(params: { dids: Did[] }): Promise<{
    statuses: { did: Did; backfillStatus: BackfillStatus }[];
  }> {
    const statuses = await this.backfillStatusQuery.findStatuses(params.dids);
    return { statuses };
  }
}

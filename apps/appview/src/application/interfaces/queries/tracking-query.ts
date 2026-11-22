import type { Did } from "@atproto/did";

import type { BackfillStatus } from "../../../domain/models/account.js";

export interface ITrackingQuery {
  findStatuses: (
    dids: Did[],
  ) => Promise<
    { did: Did; isMember: boolean; backfillStatus: BackfillStatus }[]
  >;
}

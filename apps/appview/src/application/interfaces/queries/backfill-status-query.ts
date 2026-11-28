import type { Did } from "@atproto/did";

import type { BackfillStatus } from "../../../domain/models/account.js";

export interface IBackfillStatusQuery {
  findStatuses: (
    dids: Did[],
  ) => Promise<{ did: Did; backfillStatus: BackfillStatus }[]>;
}

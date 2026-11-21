import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/interface";

import type { Tracking } from "../../../domain/tracking.js";

export interface ITrackingRepository {
  save: (params: {
    ctx: TransactionContext;
    tracking: Tracking;
  }) => Promise<void>;

  find: (params: {
    ctx: TransactionContext;
    did: Did;
  }) => Promise<Tracking | null>;

  delete: (params: { ctx: TransactionContext; did: Did }) => Promise<void>;
}

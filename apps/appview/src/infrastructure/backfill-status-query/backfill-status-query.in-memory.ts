import type { Did } from "@atproto/did";

import type {
  BackfillStatus,
  IBackfillStatusQuery,
} from "../../application/interfaces/backfill-status-query.js";

export class InMemoryBackfillStatusQuery implements IBackfillStatusQuery {
  findWithFollows(): Promise<Map<Did, BackfillStatus>> {
    return Promise.resolve(new Map<Did, BackfillStatus>());
  }
}

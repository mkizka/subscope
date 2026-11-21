import type { Did } from "@atproto/did";

import type { IAccountQuery } from "../../../application/interfaces/queries/account-query.js";

export class InMemoryAccountQuery implements IAccountQuery {
  private trackedAts: Map<Did, Date> = new Map();

  setTrackedAt(did: Did, trackedAt: Date): void {
    this.trackedAts.set(did, trackedAt);
  }

  async exists({ did }: { did: Did }) {
    return this.trackedAts.has(did);
  }

  async findTrackedAt({ did }: { did: Did }) {
    return this.trackedAts.get(did) ?? null;
  }

  async findTrackedDidsWithoutBackfillStatus() {
    return [];
  }
}

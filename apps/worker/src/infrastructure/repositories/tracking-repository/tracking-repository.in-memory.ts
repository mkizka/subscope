import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/interface";

import type { ITrackingRepository } from "../../../domain/interfaces/tracking-repository.js";
import type { Tracking } from "../../../domain/tracking.js";

export class InMemoryTrackingRepository implements ITrackingRepository {
  private trackings: Map<Did, Tracking> = new Map();

  async save({ tracking }: { ctx: TransactionContext; tracking: Tracking }) {
    this.trackings.set(tracking.did, tracking);
  }

  async find({ did }: { ctx: TransactionContext; did: Did }) {
    return this.trackings.get(did) ?? null;
  }

  async delete({ did }: { ctx: TransactionContext; did: Did }) {
    this.trackings.delete(did);
  }
}

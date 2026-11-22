import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/interface";

import type { Tracking } from "../../../application/dto/tracking.js";
import type { ITrackingRepository } from "../../../application/interfaces/repositories/tracking-repository.js";

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

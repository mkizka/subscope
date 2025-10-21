import { asDid, type Did } from "@atproto/did";

import type { Handle } from "../../utils/handle.js";
import { asHandle } from "../../utils/handle.js";

export type BackfillStatus = "dirty" | "in-process" | "synchronized";

type ActorParams = {
  did: string;
  handle?: string | null;
  backfillStatus?: BackfillStatus;
  backfillVersion?: number | null;
  indexedAt: Date;
};

export class Actor {
  readonly did: Did;
  private _handle: Handle | null = null;
  readonly backfillStatus: BackfillStatus;
  readonly backfillVersion: number | null;
  readonly indexedAt: Date;

  constructor(params: ActorParams) {
    this.did = asDid(params.did);
    this.backfillStatus = params.backfillStatus ?? "dirty";
    this.backfillVersion = params.backfillVersion ?? null;
    this.indexedAt = params.indexedAt;

    this.updateHandle(params.handle ?? null);
  }

  get handle(): Handle | null {
    return this._handle;
  }

  updateHandle(handle: string | null): void {
    this._handle = handle ? asHandle(handle) : null;
  }
}

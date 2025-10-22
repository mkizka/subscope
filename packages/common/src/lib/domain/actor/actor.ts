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
  private _backfillStatus: BackfillStatus;
  private _backfillVersion: number | null;
  readonly indexedAt: Date;

  constructor(params: ActorParams) {
    this.did = asDid(params.did);
    this._backfillStatus = params.backfillStatus ?? "dirty";
    this._backfillVersion = params.backfillVersion ?? null;
    this.indexedAt = params.indexedAt;

    this.setHandle(params.handle ?? null);
  }

  get handle(): Handle | null {
    return this._handle;
  }

  get backfillStatus(): BackfillStatus {
    return this._backfillStatus;
  }

  get backfillVersion(): number | null {
    return this._backfillVersion;
  }

  setHandle(handle: string | null): void {
    this._handle = handle ? asHandle(handle) : null;
  }

  setBackfillStatus(status: BackfillStatus): void {
    this._backfillStatus = status;
  }
}

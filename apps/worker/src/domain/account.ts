import { asDid, type Did } from "@atproto/did";
import type { Handle } from "@repo/common/utils";
import { asHandle } from "@repo/common/utils";

export type AccountStatus =
  "active" | "deactivated" | "deleted" | "suspended" | "takendown";

export type BackfillStatus = "inProgress" | "completed" | "error";

export type AccountParams = {
  did: string;
  handle: string | null;
  status?: AccountStatus;
  backfillStatus?: BackfillStatus | null;
  indexedAt: Date;
};

export class Account {
  readonly did: Did;
  private _handle: Handle | null;
  private _status: AccountStatus;
  private _backfillStatus: BackfillStatus | null;
  readonly indexedAt: Date;

  private constructor(params: AccountParams) {
    this.did = asDid(params.did);
    this._handle = params.handle ? asHandle(params.handle) : null;
    this._status = params.status ?? "active";
    this._backfillStatus = params.backfillStatus ?? null;
    this.indexedAt = params.indexedAt;
  }

  static create(params: { did: string; handle?: string | null }): Account {
    return new Account({
      did: params.did,
      handle: params.handle ?? null,
      indexedAt: new Date(),
    });
  }

  static reconstruct(params: AccountParams): Account {
    return new Account(params);
  }

  get handle(): Handle | null {
    return this._handle;
  }

  get status(): AccountStatus {
    return this._status;
  }

  get backfillStatus(): BackfillStatus | null {
    return this._backfillStatus;
  }

  updateBackfillStatus(backfillStatus: BackfillStatus): void {
    this._backfillStatus = backfillStatus;
  }

  updateStatus(status: AccountStatus): void {
    this._status = status;
  }

  updateHandle(handle: string | null): void {
    this._handle = handle ? asHandle(handle) : null;
  }
}

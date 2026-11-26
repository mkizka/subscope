import { asDid, type Did } from "@atproto/did";
import type { Handle } from "@repo/common/utils";
import { asHandle } from "@repo/common/utils";

export type AccountStatus =
  "active" | "deactivated" | "deleted" | "suspended" | "takendown";

export type BackfillStatus = "inProgress" | "completed" | "error";

const INVALID_HANDLE = "handle.invalid";

const IN_PROGRESS_TAP_STATES = ["pending", "desynchronized", "resyncing"];

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

  get needsBackfillRecheck(): boolean {
    return this._backfillStatus !== "completed";
  }

  get needsHandleResolution(): boolean {
    return !this._handle || this._handle === INVALID_HANDLE;
  }

  applyTapState(tapState: string): void {
    if (tapState === "error") {
      this._backfillStatus = "error";
    } else if (IN_PROGRESS_TAP_STATES.includes(tapState)) {
      this._backfillStatus = "inProgress";
    } else {
      this._backfillStatus = "completed";
    }
  }

  completeBackfill(): void {
    this._backfillStatus = "completed";
  }

  applyResolvedHandle({
    handle,
    resolvedDid,
  }: {
    handle: string;
    resolvedDid: string | undefined;
  }): void {
    this._handle = asHandle(resolvedDid === this.did ? handle : INVALID_HANDLE);
  }

  update({
    handle,
    status,
  }: {
    handle?: Handle;
    status?: AccountStatus;
  }): boolean {
    const changed =
      (!!handle && handle !== this._handle) ||
      (!!status && status !== this._status);
    this._handle = handle ?? this._handle;
    this._status = status ?? this._status;
    return changed;
  }
}

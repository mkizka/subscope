import { asDid, type Did } from "@atproto/did";
import type { Handle } from "@repo/common/utils";
import { asHandle } from "@repo/common/utils";
import type { BackfillStatus } from "@repo/db";

export type AccountParams = {
  did: string;
  handle: string | null;
  isAdmin: boolean;
  isBanned: boolean;
  backfillStatus?: BackfillStatus | null;
  indexedAt: Date;
};

export class Account {
  readonly did: Did;
  readonly handle: Handle | null;
  private _isAdmin: boolean;
  private _isBanned: boolean;
  readonly backfillStatus: BackfillStatus | null;
  readonly indexedAt: Date;

  private constructor(params: AccountParams) {
    this.did = asDid(params.did);
    this.handle = params.handle ? asHandle(params.handle) : null;
    this._isAdmin = params.isAdmin;
    this._isBanned = params.isBanned;
    this.backfillStatus = params.backfillStatus ?? null;
    this.indexedAt = params.indexedAt;
  }

  static create(params: { did: string; handle?: string | null }): Account {
    return new Account({
      did: params.did,
      handle: params.handle ?? null,
      isAdmin: false,
      isBanned: false,
      indexedAt: new Date(),
    });
  }

  static reconstruct(params: AccountParams): Account {
    return new Account(params);
  }

  get isAdmin(): boolean {
    return this._isAdmin;
  }

  get isBanned(): boolean {
    return this._isBanned;
  }

  promoteToAdmin(): void {
    this._isAdmin = true;
  }

  ban(): void {
    this._isBanned = true;
  }

  unban(): void {
    this._isBanned = false;
  }
}

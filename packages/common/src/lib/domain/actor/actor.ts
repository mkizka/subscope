import { asDid, type Did } from "@atproto/did";

import type { Handle } from "../../utils/handle.js";
import { asHandle } from "../../utils/handle.js";

export type ActorParams = {
  did: string;
  handle: string | null;
  isAdmin: boolean;
  isBanned: boolean;
  indexedAt: Date;
};

export class Actor {
  readonly did: Did;
  private _handle: Handle | null = null;
  private _isAdmin: boolean;
  private _isBanned: boolean;
  readonly indexedAt: Date;

  private constructor(params: ActorParams) {
    this.did = asDid(params.did);
    this._handle = params.handle ? asHandle(params.handle) : null;
    this._isAdmin = params.isAdmin;
    this._isBanned = params.isBanned;
    this.indexedAt = params.indexedAt;
  }

  static create(params: { did: string; handle?: string | null }): Actor {
    return new Actor({
      did: params.did,
      handle: params.handle ?? null,
      isAdmin: false,
      isBanned: false,
      indexedAt: new Date(),
    });
  }

  static reconstruct(params: ActorParams): Actor {
    return new Actor(params);
  }

  get handle(): Handle | null {
    return this._handle;
  }

  get isAdmin(): boolean {
    return this._isAdmin;
  }

  get isBanned(): boolean {
    return this._isBanned;
  }

  updateHandle(handle: string | null): void {
    this._handle = handle ? asHandle(handle) : null;
  }

  promoteToAdmin(): void {
    this._isAdmin = true;
  }

  ban(): void {
    this._isBanned = true;
  }
}

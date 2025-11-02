import { asDid, type Did } from "@atproto/did";

import type { Handle } from "../../utils/handle.js";
import { asHandle } from "../../utils/handle.js";

export type SyncRepoStatus =
  | "dirty"
  | "in-process"
  | "ready"
  | "synchronized"
  | "failed";

type ActorParams = {
  did: string;
  handle?: string | null;
  syncRepoStatus?: SyncRepoStatus;
  syncRepoVersion?: number | null;
  indexedAt: Date;
};

export class Actor {
  readonly did: Did;
  private _handle: Handle | null = null;
  private _syncRepoStatus: SyncRepoStatus;
  private _syncRepoVersion: number | null;
  readonly indexedAt: Date;

  constructor(params: ActorParams) {
    this.did = asDid(params.did);
    this._syncRepoStatus = params.syncRepoStatus ?? "dirty";
    this._syncRepoVersion = params.syncRepoVersion ?? null;
    this.indexedAt = params.indexedAt;

    this.setHandle(params.handle ?? null);
  }

  get handle(): Handle | null {
    return this._handle;
  }

  get syncRepoStatus(): SyncRepoStatus {
    return this._syncRepoStatus;
  }

  get syncRepoVersion(): number | null {
    return this._syncRepoVersion;
  }

  setHandle(handle: string | null): void {
    this._handle = handle ? asHandle(handle) : null;
  }

  setSyncRepoStatus(status: SyncRepoStatus): void {
    this._syncRepoStatus = status;
  }
}

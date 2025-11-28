import { asDid, type Did } from "@atproto/did";

import type { Handle } from "../../utils/handle.js";
import { asHandle } from "../../utils/handle.js";

export type SyncRepoStatus =
  | "dirty"
  | "in-process"
  | "ready"
  | "synchronized"
  | "failed";

export type ActorParams = {
  did: string;
  handle: string | null;
  syncRepoStatus: SyncRepoStatus;
  syncRepoVersion: number | null;
  indexedAt: Date;
};

export class Actor {
  readonly did: Did;
  private _handle: Handle | null = null;
  private _syncRepoStatus: SyncRepoStatus;
  private _syncRepoVersion: number | null;
  readonly indexedAt: Date;

  private constructor(params: ActorParams) {
    this.did = asDid(params.did);
    this._handle = params.handle ? asHandle(params.handle) : null;
    this._syncRepoStatus = params.syncRepoStatus;
    this._syncRepoVersion = params.syncRepoVersion;
    this.indexedAt = params.indexedAt;
  }

  static create(params: {
    did: string;
    handle?: string | null;
    indexedAt: Date;
  }): Actor {
    return new Actor({
      did: params.did,
      handle: params.handle ?? null,
      syncRepoStatus: "dirty",
      syncRepoVersion: null,
      indexedAt: params.indexedAt,
    });
  }

  static reconstruct(params: ActorParams): Actor {
    return new Actor(params);
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

  updateHandle(handle: string | null): void {
    this._handle = handle ? asHandle(handle) : null;
  }

  startSyncRepo(): void {
    this._syncRepoStatus = "in-process";
    this._syncRepoVersion = 1;
  }

  markSyncRepoReady(): void {
    if (this._syncRepoStatus !== "in-process") {
      throw new Error(
        `Cannot mark sync repo as ready from status: ${this._syncRepoStatus}`,
      );
    }
    this._syncRepoStatus = "ready";
  }

  completeSyncRepo(): void {
    if (this._syncRepoStatus !== "ready") {
      throw new Error(
        `Cannot complete sync repo from status: ${this._syncRepoStatus}`,
      );
    }
    this._syncRepoStatus = "synchronized";
  }

  failSyncRepo(): void {
    this._syncRepoStatus = "failed";
    this._syncRepoVersion = 1;
  }
}

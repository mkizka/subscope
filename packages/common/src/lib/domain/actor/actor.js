import { asDid } from "@atproto/did";
import { asHandle } from "../../utils/handle.js";
export class Actor {
  did;
  _handle = null;
  _isAdmin;
  _isBanned;
  _status;
  indexedAt;
  constructor(params) {
    this.did = asDid(params.did);
    this._handle = params.handle ? asHandle(params.handle) : null;
    this._isAdmin = params.isAdmin;
    this._isBanned = params.isBanned;
    this._status = params.status ?? "active";
    this.indexedAt = params.indexedAt;
  }
  static create(params) {
    return new Actor({
      did: params.did,
      handle: params.handle ?? null,
      isAdmin: false,
      isBanned: false,
      indexedAt: new Date(),
    });
  }
  static reconstruct(params) {
    return new Actor(params);
  }
  get handle() {
    return this._handle;
  }
  get isAdmin() {
    return this._isAdmin;
  }
  get isBanned() {
    return this._isBanned;
  }
  get status() {
    return this._status;
  }
  updateStatus(status) {
    this._status = status;
  }
  updateHandle(handle) {
    this._handle = handle ? asHandle(handle) : null;
  }
  promoteToAdmin() {
    this._isAdmin = true;
  }
  ban() {
    this._isBanned = true;
  }
  unban() {
    this._isBanned = false;
  }
}

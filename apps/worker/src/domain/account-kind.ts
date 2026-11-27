import type { Did } from "@atproto/did";

import { Like } from "./like.js";

export type Addressed = { accountDid: Did; addresseeDids: Did[] };

export class AccountKind {
  private constructor(private readonly value: "member" | "tracked" | "other") {}

  static member() {
    return new AccountKind("member");
  }

  static tracked() {
    return new AccountKind("tracked");
  }

  static other() {
    return new AccountKind("other");
  }

  get isMember() {
    return this.value === "member";
  }

  get isTracked() {
    return this.value === "tracked";
  }

  get usesTap() {
    return this.value === "member";
  }

  get syncsLabels() {
    return this.value !== "other";
  }

  savesWithoutAddressee(record: Addressed) {
    if (this.value === "member") {
      return true;
    }
    return this.value === "tracked" && !(record instanceof Like);
  }
}

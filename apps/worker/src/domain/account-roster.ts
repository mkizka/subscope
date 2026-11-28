import type { Did } from "@atproto/did";

import type { AccountKind } from "./account-kind.js";

export type StreamEvent =
  | {
      kind: "commit";
      authorDid: Did;
      operation: "create" | "update" | "delete";
      collection: string;
      containedDids: Did[];
    }
  | { kind: "identity" | "account"; authorDid: Did };

const ADDRESSABLE_COLLECTIONS = new Set([
  "app.bsky.feed.post",
  "app.bsky.feed.repost",
  "app.bsky.feed.like",
  "app.bsky.graph.follow",
]);

const FOLLOWER_COLLECTIONS = new Set([
  "app.bsky.feed.post",
  "app.bsky.feed.repost",
  "app.bsky.graph.follow",
  "app.bsky.actor.profile",
  "app.bsky.actor.link",
]);

const GATE_COLLECTIONS = new Set([
  "app.bsky.feed.threadgate",
  "app.bsky.feed.postgate",
]);

export class AccountRoster {
  private members = new Set<Did>();
  private tracked = new Set<Did>();

  replace({
    memberDids,
    trackedDids,
  }: {
    memberDids: Did[];
    trackedDids: Did[];
  }) {
    this.members = new Set(memberDids);
    this.tracked = new Set(trackedDids);
  }

  set(did: Did, kind: AccountKind) {
    this.members.delete(did);
    this.tracked.delete(did);
    if (kind.isMember) {
      this.members.add(did);
    }
    if (kind.isTracked) {
      this.tracked.add(did);
    }
  }

  passes(event: StreamEvent) {
    if (this.members.has(event.authorDid)) {
      return false;
    }
    const isTracked = this.tracked.has(event.authorDid);
    if (event.kind !== "commit") {
      return isTracked;
    }
    if (event.operation === "delete") {
      return true;
    }
    if (GATE_COLLECTIONS.has(event.collection)) {
      return true;
    }
    if (isTracked && FOLLOWER_COLLECTIONS.has(event.collection)) {
      return true;
    }
    // 宛先の正確な判定はStoragePolicyに任せ、ここではメンバーのDIDを含まないレコードを捨てる
    return (
      ADDRESSABLE_COLLECTIONS.has(event.collection) &&
      event.containedDids.some((did) => this.members.has(did))
    );
  }
}

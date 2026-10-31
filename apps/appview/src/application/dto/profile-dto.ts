import type { Did } from "@atproto/did";
import type { HandleString } from "@atproto/syntax";

export type ProfileDto = {
  actorDid: Did;
  handle: HandleString | null;
  displayName: string | null;
  description: string | null;
  avatarCid: string | null;
  createdAt: Date | null;
  indexedAt: Date;
  status: "active" | "deactivated" | "deleted" | "suspended" | "takendown";
};

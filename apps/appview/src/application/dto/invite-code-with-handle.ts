import type { Did } from "@atproto/did";
import type { Handle } from "@repo/common/utils";

type UsedBy = {
  did: Did;
  handle: Handle | null;
};

export type InviteCodeDto = {
  code: string;
  expiresAt: Date;
  createdAt: Date;
  usedAt: Date | null;
  usedBy: UsedBy | null;
};

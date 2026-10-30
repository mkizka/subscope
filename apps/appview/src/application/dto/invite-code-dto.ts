import type { Did } from "@atproto/did";

export type InviteCodeDto = {
  code: string;
  expiresAt: Date;
  createdAt: Date;
  usedAt: Date | null;
  usedByDid: Did | null;
};

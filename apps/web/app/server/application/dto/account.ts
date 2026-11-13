import type { BackfillStatus } from "@/app/lib/backfill-status";

export type ProfileTab = "posts" | "replies" | "media" | "video" | "likes";

export type AccountDto = {
  did: string;
  handle: string;
  displayName?: string;
  avatarUrl?: string;
  description?: string;
  backfillStatus?: BackfillStatus;
};

export type FollowListDto = {
  subject: AccountDto;
  accounts: AccountDto[];
  registeredCount?: number;
  cursor?: string;
};

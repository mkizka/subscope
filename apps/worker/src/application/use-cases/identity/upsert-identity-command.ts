import type { Did } from "@atproto/did";
import type { Handle } from "@repo/common/utils";
import type { AccountStatus } from "@repo/db";

export type UpsertIdentityCommand = {
  did: Did;
  handle?: Handle;
  status: AccountStatus;
};

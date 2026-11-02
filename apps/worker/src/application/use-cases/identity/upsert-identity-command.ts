import type { Did } from "@atproto/did";
import type { AccountStatus } from "@repo/common/domain";
import type { Handle } from "@repo/common/utils";

export type UpsertIdentityCommand = {
  did: Did;
  handle?: Handle;
  status: AccountStatus;
};

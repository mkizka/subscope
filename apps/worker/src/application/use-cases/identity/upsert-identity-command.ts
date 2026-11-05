import type { Did } from "@atproto/did";
import type { Handle } from "@repo/common/utils";

import type { AccountStatus } from "../../../domain/account.js";

export type UpsertIdentityCommand = {
  did: Did;
  handle?: Handle;
  status: AccountStatus;
};

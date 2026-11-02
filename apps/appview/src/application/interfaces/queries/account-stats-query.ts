import type { Did } from "@atproto/did";

import type { AccountStatsDto } from "../../dto/account-stats-dto.js";

export interface IAccountStatsQuery {
  findStats: (accountDids: Did[]) => Promise<AccountStatsDto[]>;
}

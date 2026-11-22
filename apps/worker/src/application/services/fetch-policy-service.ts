import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";

import type { FetchTarget } from "../dto/fetch-target.js";
import type { Origin } from "../dto/origin.js";
import type { IProfileQuery } from "../interfaces/queries/profile-query.js";
import type { IAccountRepository } from "../interfaces/repositories/account-repository.js";
import type { IRecordRepository } from "../interfaces/repositories/record-repository.js";

const MAX_HOP = 2;

export class FetchPolicyService {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly profileQuery: IProfileQuery,
    private readonly recordRepository: IRecordRepository,
  ) {}

  async targetsFor({
    ctx,
    origin,
    records,
    accounts,
  }: {
    ctx: TransactionContext;
    origin: Origin;
    records: AtUri[];
    accounts: Did[];
  }): Promise<FetchTarget[]> {
    const hop = origin.type === "pds" ? origin.hop + 1 : 1;
    const targets: FetchTarget[] = [];
    for (const uri of hop > MAX_HOP ? [] : records) {
      const record = await this.recordRepository.find({ ctx, uri });
      if (!record) {
        targets.push({ type: "record", uri, hop });
      }
    }
    return [...targets, ...(await this.targetsForAccounts(ctx, accounts))];
  }

  async targetsForAccounts(
    ctx: TransactionContext,
    dids: Did[],
  ): Promise<FetchTarget[]> {
    const targets: FetchTarget[] = [];
    for (const did of dids) {
      const account = await this.accountRepository.find({ ctx, did });
      if (!account?.handle) {
        targets.push({ type: "handle", did });
      }
      const profileExists = await this.profileQuery.exists({
        ctx,
        accountDid: did,
      });
      if (!profileExists) {
        targets.push({ type: "profile", did });
      }
    }
    return targets;
  }
}

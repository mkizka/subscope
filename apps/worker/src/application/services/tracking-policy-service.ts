import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/interface";

import { parseFollow } from "../dto/follow.js";
import type { Record } from "../dto/record.js";
import type { IRegistrationQuery } from "../interfaces/queries/registration-query.js";

export class TrackingPolicyService {
  constructor(private readonly registrationQuery: IRegistrationQuery) {}

  async reposToSync({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }): Promise<Did[]> {
    if (record.uri.collection !== "app.bsky.graph.follow") {
      return [];
    }
    const follow = parseFollow(record);
    const isFollowerMember = await this.registrationQuery.isRegistered(
      ctx,
      follow.accountDid,
    );
    return isFollowerMember ? [follow.subjectDid] : [];
  }
}

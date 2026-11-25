import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { AfterCommitContext, IJobScheduler } from "@repo/common/interface";

import type { Origin } from "../../domain/origin.js";
import type { IProfileQuery } from "../interfaces/queries/profile-query.js";
import type { IRecordQuery } from "../interfaces/queries/record-query.js";
import type { IAccountRepository } from "../interfaces/repositories/account-repository.js";

export class RelatedRecordService {
  constructor(
    private readonly recordQuery: IRecordQuery,
    private readonly profileQuery: IProfileQuery,
    private readonly accountRepository: IAccountRepository,
    private readonly jobScheduler: IJobScheduler,
  ) {}

  async request({
    ctx,
    origin,
    uri,
  }: {
    ctx: AfterCommitContext;
    origin: Origin;
    uri: AtUri | null;
  }) {
    if (!uri || !origin.canFetchRelated) {
      return;
    }
    const saved = await this.recordQuery.exists(ctx, uri);
    if (saved) {
      return;
    }
    ctx.afterCommit(() =>
      this.jobScheduler.scheduleFetchRecord(uri, origin.jobOptions),
    );
  }

  async requestAccount({
    ctx,
    origin,
    did,
  }: {
    ctx: AfterCommitContext;
    origin: Origin;
    did: Did;
  }) {
    const { live } = origin.jobOptions;
    const account = await this.accountRepository.find({ ctx, did });
    if (!account?.handle) {
      ctx.afterCommit(() =>
        this.jobScheduler.scheduleResolveDid(did, { live }),
      );
    }
    const hasProfile = await this.profileQuery.exists({ ctx, accountDid: did });
    if (!hasProfile) {
      const profileUri = AtUri.make(did, "app.bsky.actor.profile", "self");
      ctx.afterCommit(() =>
        this.jobScheduler.scheduleFetchRecord(profileUri, { live, depth: 0 }),
      );
    }
  }
}

import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import type { AfterCommitContext, IJobScheduler } from "@repo/common/interface";

export class StatsService {
  constructor(private readonly jobScheduler: IJobScheduler) {}

  recount({
    ctx,
    posts = [],
    accounts = [],
  }: {
    ctx: AfterCommitContext;
    posts?: AtUri[];
    accounts?: Did[];
  }) {
    for (const uri of posts) {
      ctx.afterCommit(() => this.jobScheduler.scheduleAggregatePostStats(uri));
    }
    for (const did of accounts) {
      ctx.afterCommit(() =>
        this.jobScheduler.scheduleAggregateAccountStats(did),
      );
    }
  }
}

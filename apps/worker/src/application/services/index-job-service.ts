import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { AfterCommitContext, IJobScheduler } from "@repo/common/interface";

import type { FetchTarget } from "../dto/fetch-target.js";
import type { JobPriority } from "../dto/origin.js";
import type { StatsTargets } from "../dto/stats-targets.js";
import type { Notification } from "../interfaces/repositories/notification-repository.js";

type Push = Pick<Notification, "recordUri" | "recipientDid">;

export class IndexJobService {
  constructor(private readonly jobScheduler: IJobScheduler) {}

  schedule({
    ctx,
    priority,
    fetch = [],
    stats = { accounts: [], posts: [] },
    reposToSync = [],
    pushes = [],
  }: {
    ctx: AfterCommitContext;
    priority: JobPriority;
    fetch?: FetchTarget[];
    stats?: StatsTargets;
    reposToSync?: Did[];
    pushes?: Push[];
  }) {
    const live = priority === "high";
    ctx.afterCommit(async () => {
      await Promise.all([
        ...fetch.map((target) =>
          target.type === "handle"
            ? this.jobScheduler.scheduleResolveDid(target.did, { live })
            : this.jobScheduler.scheduleFetchRecord(target.uri, {
                live,
                depth: target.hop - 1,
              }),
        ),
        ...stats.accounts.map((did) =>
          this.jobScheduler.scheduleAggregateAccountStats(did),
        ),
        ...stats.posts.map((uri) =>
          this.jobScheduler.scheduleAggregatePostStats(uri),
        ),
        ...reposToSync.map((did) => this.jobScheduler.scheduleSyncTapRepo(did)),
        ...pushes.map(({ recordUri, recipientDid }) =>
          this.jobScheduler.scheduleSendPushNotification(
            new AtUri(recordUri),
            asDid(recipientDid),
          ),
        ),
      ]);
    });
  }
}

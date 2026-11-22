import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type {
  AfterCommitContext,
  IJobScheduler,
  JobPriority,
} from "@repo/common/interface";

import type { FetchTarget } from "../dto/fetch-target.js";
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
    stats?: { accounts: Did[]; posts: AtUri[] };
    reposToSync?: Did[];
    pushes?: Push[];
  }) {
    ctx.afterCommit(async () => {
      await Promise.all([
        ...fetch.map((target) => {
          switch (target.type) {
            case "record":
              return this.jobScheduler.scheduleFetchRecord(target.uri, {
                hop: target.hop,
                priority,
              });
            case "profile":
              return this.jobScheduler.scheduleFetchRecord(
                AtUri.make(target.did, "app.bsky.actor.profile", "self"),
                { hop: 1, priority },
              );
            case "handle":
              return this.jobScheduler.scheduleResolveDid(target.did, {
                priority,
              });
          }
        }),
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

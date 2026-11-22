import type { AfterCommitContext, IJobScheduler } from "@repo/common/interface";

import type { FetchTarget } from "../dto/fetch-target.js";
import type { JobPriority } from "../dto/origin.js";

export class FetchJobService {
  constructor(private readonly jobScheduler: IJobScheduler) {}

  schedule({
    ctx,
    targets,
    priority,
  }: {
    ctx: AfterCommitContext;
    targets: FetchTarget[];
    priority: JobPriority;
  }) {
    const live = priority === "high";
    ctx.afterCommit(async () => {
      await Promise.all(
        targets.map((target) =>
          target.type === "handle"
            ? this.jobScheduler.scheduleResolveDid(target.did, { live })
            : this.jobScheduler.scheduleFetchRecord(target.uri, {
                live,
                depth: target.hop - 1,
              }),
        ),
      );
    });
  }
}

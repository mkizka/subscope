import type { AfterCommitContext, IJobScheduler } from "@repo/common/interface";

import type { JobPriority, Origin } from "../../dto/origin.js";
import type { Record } from "../../dto/record.js";
import type { IPostQuery } from "../../interfaces/queries/post-query.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";
import { gatedPostUri, isGateOfSamePost } from "../storage-policy-service.js";

export class GateIndexer implements ICollectionIndexer {
  constructor(
    private readonly postQuery: IPostQuery,
    private readonly jobScheduler: IJobScheduler,
  ) {}

  upsert() {
    return Promise.resolve();
  }

  async afterSkip({
    ctx,
    record,
    origin,
    priority,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    origin: Origin;
    priority: JobPriority;
  }) {
    if (origin.type === "pds" || !isGateOfSamePost(record)) {
      return;
    }
    const postExists = await this.postQuery.exists(ctx, gatedPostUri(record));
    if (postExists) {
      return;
    }
    ctx.afterCommit(() =>
      this.jobScheduler.scheduleFetchRecord(record.uri, {
        live: priority === "high",
        depth: 0,
      }),
    );
  }
}

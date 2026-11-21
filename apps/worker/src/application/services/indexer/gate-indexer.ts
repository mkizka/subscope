import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { AfterCommitContext, IJobScheduler } from "@repo/common/interface";
import { validateRecord } from "@repo/common/utils";

import type { Record } from "../../dto/record.js";
import type { IPostQuery } from "../../interfaces/queries/post-query.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";

export class GateIndexer implements ICollectionIndexer {
  constructor(
    private readonly postQuery: IPostQuery,
    private readonly jobScheduler: IJobScheduler,
  ) {}

  async shouldIndex({
    ctx,
    record,
    live,
    depth,
  }: {
    ctx: AfterCommitContext;
    record: Record;
    live: boolean;
    depth: number;
  }) {
    const gate = validateRecord(
      record.uri.collection === "app.bsky.feed.threadgate"
        ? "app.bsky.feed.threadgate"
        : "app.bsky.feed.postgate",
      record,
    );
    const postUri = new AtUri(gate.post);
    if (
      postUri.host !== asDid(record.uri.host) ||
      postUri.collection !== "app.bsky.feed.post" ||
      postUri.rkey !== record.uri.rkey
    ) {
      return false;
    }
    if (await this.postQuery.exists(ctx, postUri)) {
      return true;
    }
    if (depth === 0) {
      ctx.afterCommit(() =>
        this.jobScheduler.scheduleFetchRecord(record.uri, { live, depth }),
      );
    }
    return false;
  }

  upsert() {
    return Promise.resolve();
  }
}

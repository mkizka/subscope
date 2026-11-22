import { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";
import { validateRecord } from "@repo/common/utils";

import type { Origin } from "../dto/origin.js";
import type { Record } from "../dto/record.js";
import type { IRegistrationQuery } from "../interfaces/queries/registration-query.js";
import type { ITrackingRepository } from "../interfaces/repositories/tracking-repository.js";

const PAST_LIMITED_COLLECTIONS = [
  "app.bsky.feed.post",
  "app.bsky.feed.repost",
  "app.bsky.feed.like",
] as const;

// Postgresには`\u0000`を含む文字列を保存できないため
const containsNullChar = (record: Record) =>
  JSON.stringify(record.json).includes("\\u0000");

const isGateOfSamePost = (record: Record) => {
  const gate = validateRecord(
    record.uri.collection === "app.bsky.feed.threadgate"
      ? "app.bsky.feed.threadgate"
      : "app.bsky.feed.postgate",
    record,
  );
  const postUri = new AtUri(gate.post);
  return (
    postUri.host === record.uri.did &&
    postUri.collection === "app.bsky.feed.post" &&
    postUri.rkey === record.uri.rkey
  );
};

export class StoragePolicyService {
  constructor(
    private readonly registrationQuery: IRegistrationQuery,
    private readonly trackingRepository: ITrackingRepository,
  ) {}

  async shouldStore({
    ctx,
    record,
    origin,
  }: {
    ctx: TransactionContext;
    record: Record;
    origin: Origin;
  }): Promise<boolean> {
    const isOutsidePastWindow =
      origin.type === "tapPast" &&
      !(await this.isWithinPastWindow(ctx, record));
    if (isOutsidePastWindow) {
      return false;
    }
    if (containsNullChar(record)) {
      return false;
    }
    switch (record.uri.collection) {
      case "app.bsky.feed.threadgate":
      case "app.bsky.feed.postgate":
        return isGateOfSamePost(record);
      case "app.bsky.feed.like":
        return this.isLikeAroundMember(ctx, record);
      default:
        return true;
    }
  }

  private async isWithinPastWindow(ctx: TransactionContext, record: Record) {
    const collection = PAST_LIMITED_COLLECTIONS.find(
      (collection) => collection === record.uri.collection,
    );
    if (!collection) {
      return true;
    }
    const did = record.uri.did;
    const isRegistered = await this.registrationQuery.isRegistered(ctx, did);
    if (isRegistered) {
      return true;
    }
    const tracking = await this.trackingRepository.find({ ctx, did });
    const { createdAt } = validateRecord(collection, record);
    return !!tracking && tracking.covers(new Date(createdAt));
  }

  private async isLikeAroundMember(ctx: TransactionContext, record: Record) {
    const like = validateRecord("app.bsky.feed.like", record);
    return (
      (await this.registrationQuery.isRegistered(ctx, record.uri.did)) ||
      (await this.registrationQuery.isRegistered(
        ctx,
        new AtUri(like.subject.uri).host,
      ))
    );
  }
}

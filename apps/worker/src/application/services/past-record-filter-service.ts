import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/interface";
import { validateRecord } from "@repo/common/utils";

import type { Record } from "../dto/record.js";
import type { IRegistrationQuery } from "../interfaces/queries/registration-query.js";
import type { ITrackingRepository } from "../interfaces/repositories/tracking-repository.js";

const LIMITED_COLLECTIONS = [
  "app.bsky.feed.post",
  "app.bsky.feed.repost",
  "app.bsky.feed.like",
] as const;

const PAST_RECORD_WINDOW_MS = 24 * 60 * 60 * 1000;

export class PastRecordFilterService {
  constructor(
    private readonly registrationQuery: IRegistrationQuery,
    private readonly trackingRepository: ITrackingRepository,
  ) {}

  async shouldIndex({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }) {
    const collection = LIMITED_COLLECTIONS.find(
      (collection) => collection === record.uri.collection,
    );
    if (!collection) {
      return true;
    }
    const did = record.uri.did;
    if (await this.registrationQuery.isRegistered(ctx, did)) {
      return true;
    }
    const { createdAt } = validateRecord(collection, record);
    return this.isWithinWindow({ ctx, did, createdAt: new Date(createdAt) });
  }

  async isWithinWindow({
    ctx,
    did,
    createdAt,
  }: {
    ctx: TransactionContext;
    did: Did;
    createdAt: Date;
  }) {
    const tracking = await this.trackingRepository.find({ ctx, did });
    return (
      !!tracking &&
      createdAt.getTime() >=
        tracking.trackedAt.getTime() - PAST_RECORD_WINDOW_MS
    );
  }
}

import { asDid } from "@atproto/did";
import type { TransactionContext } from "@repo/common/interface";
import { validateRecord } from "@repo/common/utils";

import type { Record } from "../dto/record.js";
import type { Tracking } from "../dto/tracking.js";
import type { IRegistrationQuery } from "../interfaces/queries/registration-query.js";
import type { ITrackingRepository } from "../interfaces/repositories/tracking-repository.js";

const LIMITED_COLLECTIONS = [
  "app.bsky.feed.post",
  "app.bsky.feed.repost",
  "app.bsky.feed.like",
] as const;

const PAST_RECORD_WINDOW_MS = 24 * 60 * 60 * 1000;

const isOutsidePastRecordWindow = (tracking: Tracking, createdAt: Date) =>
  createdAt.getTime() < tracking.trackedAt.getTime() - PAST_RECORD_WINDOW_MS;

export class PastRecordFilterService {
  constructor(
    private readonly registrationQuery: IRegistrationQuery,
    private readonly trackingRepository: ITrackingRepository,
  ) {}

  async isOutsideWindow({
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
      return false;
    }
    const did = asDid(record.uri.host);
    if (await this.registrationQuery.isRegistered(ctx, did)) {
      return false;
    }
    const tracking = await this.trackingRepository.find({ ctx, did });
    if (!tracking) {
      return false;
    }
    const { createdAt } = validateRecord(collection, record);
    return isOutsidePastRecordWindow(tracking, new Date(createdAt));
  }
}

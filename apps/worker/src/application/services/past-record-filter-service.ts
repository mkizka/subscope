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
    const isRegistered = await this.registrationQuery.isRegistered(ctx, did);
    if (isRegistered) {
      return true;
    }
    const tracking = await this.trackingRepository.find({ ctx, did });
    const { createdAt } = validateRecord(collection, record);
    return !!tracking && tracking.covers(new Date(createdAt));
  }
}

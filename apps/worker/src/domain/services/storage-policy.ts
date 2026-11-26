import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/interface";

import type { Follow } from "../follow.js";
import type { IRegistrationQuery } from "../interfaces/registration-query.js";
import type { ITrackingRepository } from "../interfaces/tracking-repository.js";
import type { Like } from "../like.js";
import type { ListItem } from "../list-item.js";
import type { Origin } from "../origin.js";

type DatedRecord = { accountDid: Did; createdAt: Date };

export class StoragePolicy {
  constructor(
    private readonly registrationQuery: IRegistrationQuery,
    private readonly trackingRepository: ITrackingRepository,
  ) {}

  async storesFeedRecord({
    ctx,
    origin,
    record,
  }: {
    ctx: TransactionContext;
    origin: Origin;
    record: DatedRecord;
  }) {
    return (
      !origin.isPast ||
      (await this.registrationQuery.isRegistered(ctx, record.accountDid)) ||
      (await this.isWithinWindow(ctx, origin, record))
    );
  }

  async storesLike({
    ctx,
    origin,
    like,
  }: {
    ctx: TransactionContext;
    origin: Origin;
    like: Like;
  }) {
    const likerIsMember = await this.registrationQuery.isRegistered(
      ctx,
      like.accountDid,
    );
    if (likerIsMember) {
      return true;
    }
    const subjectAuthorIsMember = await this.registrationQuery.isRegistered(
      ctx,
      like.subjectAuthorDid,
    );
    return (
      subjectAuthorIsMember && (await this.isWithinWindow(ctx, origin, like))
    );
  }

  async fetchesLikedPost({
    ctx,
    origin,
    like,
  }: {
    ctx: TransactionContext;
    origin: Origin;
    like: Like;
  }) {
    return (
      like.likesPost &&
      (await this.registrationQuery.isRegistered(ctx, like.accountDid)) &&
      (await this.isWithinWindow(ctx, origin, like))
    );
  }

  async isTracked(ctx: TransactionContext, did: Did) {
    return (
      (await this.registrationQuery.isRegistered(ctx, did)) ||
      (await this.registrationQuery.isFollowedByAnyServerMember(ctx, did))
    );
  }

  tracksFollowee(ctx: TransactionContext, follow: Follow) {
    return this.registrationQuery.isRegistered(ctx, follow.accountDid);
  }

  fetchesListItemSubject(ctx: TransactionContext, listItem: ListItem) {
    return this.registrationQuery.isRegistered(ctx, listItem.accountDid);
  }

  private async isWithinWindow(
    ctx: TransactionContext,
    origin: Origin,
    record: DatedRecord,
  ) {
    if (!origin.isPast) {
      return true;
    }
    const tracking = await this.trackingRepository.find({
      ctx,
      did: record.accountDid,
    });
    return !!tracking && tracking.covers(record.createdAt);
  }
}

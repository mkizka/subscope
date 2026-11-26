import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";

import { Follow } from "../follow.js";
import type { IRegistrationQuery } from "../interfaces/registration-query.js";
import type { ITrackingRepository } from "../interfaces/tracking-repository.js";
import { Like } from "../like.js";
import { ListItem } from "../list-item.js";
import type { Origin } from "../origin.js";
import { Post } from "../post.js";
import { Profile } from "../profile.js";
import { Repost } from "../repost.js";

type DatedRecord = { accountDid: Did; createdAt: Date };

type Saved =
  Post | Repost | Like | Follow | ListItem | Profile | { accountDid: Did };

export class StoragePolicy {
  constructor(
    private readonly registrationQuery: IRegistrationQuery,
    private readonly trackingRepository: ITrackingRepository,
  ) {}

  async savesFeedRecord({
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
      (await this.registrationQuery.isMember(ctx, record.accountDid)) ||
      (await this.isWithinWindow({ ctx, origin, record }))
    );
  }

  async savesLike({
    ctx,
    origin,
    like,
  }: {
    ctx: TransactionContext;
    origin: Origin;
    like: Like;
  }) {
    const likerIsMember = await this.registrationQuery.isMember(
      ctx,
      like.accountDid,
    );
    if (likerIsMember) {
      return true;
    }
    const subjectAuthorIsMember = await this.registrationQuery.isMember(
      ctx,
      like.subjectAuthorDid,
    );
    return (
      subjectAuthorIsMember &&
      (await this.isWithinWindow({ ctx, origin, record: like }))
    );
  }

  async recordsToFetch({
    ctx,
    origin,
    record,
  }: {
    ctx: TransactionContext;
    origin: Origin;
    record: Saved;
  }): Promise<AtUri[]> {
    if (record instanceof Post) {
      const replyUris = origin.isFetched
        ? []
        : [record.replyParent?.uri, record.replyRoot?.uri];
      return [record.fetchableEmbedUri, ...replyUris].filter((uri) => !!uri);
    }
    if (record instanceof Repost) {
      return [record.subject];
    }
    if (record instanceof Profile) {
      return record.pinnedPost && !origin.isFetched ? [record.pinnedPost] : [];
    }
    if (record instanceof Like) {
      const fetchesLikedPost = await this.fetchesLikedPost({
        ctx,
        origin,
        like: record,
      });
      return fetchesLikedPost ? [record.subject] : [];
    }
    return [];
  }

  async accountsToFetch({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Saved;
  }): Promise<Did[]> {
    if (record instanceof Follow || record instanceof ListItem) {
      const authorIsMember = await this.registrationQuery.isMember(
        ctx,
        record.accountDid,
      );
      if (authorIsMember) {
        return [record.accountDid, record.subjectDid];
      }
    }
    return [record.accountDid];
  }

  private async fetchesLikedPost({
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
      (await this.registrationQuery.isMember(ctx, like.accountDid)) &&
      (await this.isWithinWindow({ ctx, origin, record: like }))
    );
  }

  async isTracked(ctx: TransactionContext, did: Did) {
    return (
      (await this.registrationQuery.isMember(ctx, did)) ||
      (await this.registrationQuery.isFollowedByAnyServerMember(ctx, did))
    );
  }

  tracksFollowee(ctx: TransactionContext, follow: Follow) {
    return this.registrationQuery.isMember(ctx, follow.accountDid);
  }

  private async isWithinWindow({
    ctx,
    origin,
    record,
  }: {
    ctx: TransactionContext;
    origin: Origin;
    record: DatedRecord;
  }) {
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

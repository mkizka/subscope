import { asDid, type Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";

import type { FetchTarget } from "../dto/fetch-target.js";
import { parseFollow } from "../dto/follow.js";
import { type Like, parseLike } from "../dto/like.js";
import { parseListItem } from "../dto/list-item.js";
import type { Origin } from "../dto/origin.js";
import { getEmbedRecordUri, parsePost, type Post } from "../dto/post.js";
import type { Record } from "../dto/record.js";
import { parseRepost } from "../dto/repost.js";
import type { IPostQuery } from "../interfaces/queries/post-query.js";
import type { IProfileQuery } from "../interfaces/queries/profile-query.js";
import type { IRegistrationQuery } from "../interfaces/queries/registration-query.js";
import type { IAccountRepository } from "../interfaces/repositories/account-repository.js";
import type { ITrackingRepository } from "../interfaces/repositories/tracking-repository.js";

const MAX_HOP = 2;

export class FetchPolicyService {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly profileQuery: IProfileQuery,
    private readonly postQuery: IPostQuery,
    private readonly registrationQuery: IRegistrationQuery,
    private readonly trackingRepository: ITrackingRepository,
  ) {}

  async targetsForRecord({
    ctx,
    record,
    origin,
  }: {
    ctx: TransactionContext;
    record: Record;
    origin: Origin;
  }): Promise<FetchTarget[]> {
    return [
      ...(await this.targetsForAccount({ ctx, did: record.uri.did })),
      ...(await this.relatedTargets(ctx, record, origin)),
    ];
  }

  async targetsForAccount({
    ctx,
    did,
  }: {
    ctx: TransactionContext;
    did: Did;
  }): Promise<FetchTarget[]> {
    const targets: FetchTarget[] = [];
    const account = await this.accountRepository.find({ ctx, did });
    if (!account?.handle) {
      targets.push({ type: "handle", did });
    }
    const profileExists = await this.profileQuery.exists({
      ctx,
      accountDid: did,
    });
    if (!profileExists) {
      targets.push({
        type: "record",
        uri: AtUri.make(did, "app.bsky.actor.profile", "self"),
        hop: 1,
      });
    }
    return targets;
  }

  private async relatedTargets(
    ctx: TransactionContext,
    record: Record,
    origin: Origin,
  ): Promise<FetchTarget[]> {
    switch (record.uri.collection) {
      case "app.bsky.feed.post":
        return this.referencedPosts(ctx, parsePost(record), origin);
      case "app.bsky.feed.repost": {
        const repost = parseRepost(record);
        return this.missingRecord(ctx, new AtUri(repost.subjectUri), origin);
      }
      case "app.bsky.feed.like":
        return this.likedPost(ctx, parseLike(record), origin);
      case "app.bsky.graph.follow":
        return this.subjectOfMember(ctx, parseFollow(record));
      case "app.bsky.graph.listitem":
        return this.subjectOfMember(ctx, parseListItem(record));
      default:
        return [];
    }
  }

  private async referencedPosts(
    ctx: TransactionContext,
    post: Post,
    origin: Origin,
  ): Promise<FetchTarget[]> {
    const uris = [
      getEmbedRecordUri(post),
      ...(origin.type === "pds"
        ? []
        : [post.replyParent?.uri, post.replyRoot?.uri]),
    ];
    const targets: FetchTarget[] = [];
    for (const uri of uris) {
      if (uri) {
        targets.push(...(await this.missingRecord(ctx, uri, origin)));
      }
    }
    return targets;
  }

  private async missingRecord(
    ctx: TransactionContext,
    uri: AtUri,
    origin: Origin,
  ): Promise<FetchTarget[]> {
    const hop = (origin.type === "pds" ? origin.hop : 0) + 1;
    if (hop > MAX_HOP) {
      return [];
    }
    const exists = await this.postQuery.exists(ctx, uri);
    return exists ? [] : [{ type: "record", uri, hop }];
  }

  private async likedPost(
    ctx: TransactionContext,
    like: Like,
    origin: Origin,
  ): Promise<FetchTarget[]> {
    const subjectUri = new AtUri(like.subjectUri);
    if (subjectUri.collection !== "app.bsky.feed.post") {
      return [];
    }
    const isMember = await this.registrationQuery.isRegistered(
      ctx,
      like.accountDid,
    );
    if (!isMember) {
      return [];
    }
    if (origin.type !== "tapLive") {
      const tracking = await this.trackingRepository.find({
        ctx,
        did: asDid(like.accountDid),
      });
      if (!tracking?.covers(like.createdAt)) {
        return [];
      }
    }
    return this.missingRecord(ctx, subjectUri, origin);
  }

  private async subjectOfMember(
    ctx: TransactionContext,
    { accountDid, subjectDid }: { accountDid: Did; subjectDid: Did },
  ): Promise<FetchTarget[]> {
    const isMember = await this.registrationQuery.isRegistered(ctx, accountDid);
    return isMember ? this.targetsForAccount({ ctx, did: subjectDid }) : [];
  }
}

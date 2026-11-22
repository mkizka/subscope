import { asDid, type Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";

import type { Author } from "../dto/author.js";
import type { FetchTarget } from "../dto/fetch-target.js";
import type { Like } from "../dto/like.js";
import type { Origin } from "../dto/origin.js";
import type { ParsedRecord } from "../dto/parsed-record.js";
import { getEmbedRecordUri } from "../dto/post.js";
import type { IPostQuery } from "../interfaces/queries/post-query.js";
import type { IProfileQuery } from "../interfaces/queries/profile-query.js";
import type { IAccountRepository } from "../interfaces/repositories/account-repository.js";
import type { ITrackingRepository } from "../interfaces/repositories/tracking-repository.js";

const MAX_HOP = 2;

export class FetchPolicyService {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly profileQuery: IProfileQuery,
    private readonly postQuery: IPostQuery,
    private readonly trackingRepository: ITrackingRepository,
  ) {}

  async targetsForRecord({
    ctx,
    parsed,
    author,
    origin,
  }: {
    ctx: TransactionContext;
    parsed: ParsedRecord;
    author: Author;
    origin: Origin;
  }): Promise<FetchTarget[]> {
    return [
      ...(await this.targetsForAccount({ ctx, did: author.did })),
      ...(await this.relatedTargets(ctx, parsed, author, origin)),
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
    parsed: ParsedRecord,
    author: Author,
    origin: Origin,
  ): Promise<FetchTarget[]> {
    switch (parsed.collection) {
      case "app.bsky.feed.post": {
        const embedUri = getEmbedRecordUri(parsed.post);
        return embedUri ? this.missingRecord(ctx, embedUri, origin) : [];
      }
      case "app.bsky.feed.repost":
        return this.missingRecord(
          ctx,
          new AtUri(parsed.repost.subjectUri),
          origin,
        );
      case "app.bsky.feed.like":
        return author.isMember ? this.likedPost(ctx, parsed.like, origin) : [];
      case "app.bsky.graph.follow":
        return author.isMember
          ? this.targetsForAccount({ ctx, did: parsed.follow.subjectDid })
          : [];
      case "app.bsky.graph.listitem":
        return author.isMember
          ? this.targetsForAccount({ ctx, did: parsed.listItem.subjectDid })
          : [];
      case "app.bsky.actor.profile":
      case "app.bsky.feed.generator":
      case "app.bsky.graph.list":
      case "app.bsky.actor.link":
      case "app.bsky.feed.threadgate":
      case "app.bsky.feed.postgate":
        return [];
    }
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
}

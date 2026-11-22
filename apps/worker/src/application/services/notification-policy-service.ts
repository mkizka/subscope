import { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";
import { validateRecord } from "@repo/common/utils";

import { parseFollow } from "../dto/follow.js";
import { parseLike } from "../dto/like.js";
import type { Origin } from "../dto/origin.js";
import { getEmbedRecordUri, parsePost } from "../dto/post.js";
import type { Record } from "../dto/record.js";
import { parseRepost } from "../dto/repost.js";
import { getSortAt } from "../dto/sort-at.js";
import type { IPostQuery } from "../interfaces/queries/post-query.js";
import type { IRegistrationQuery } from "../interfaces/queries/registration-query.js";
import type { Notification } from "../interfaces/repositories/notification-repository.js";

const REPLY_NOTIFICATION_DEPTH = 4;

export class NotificationPolicyService {
  constructor(
    private readonly postQuery: IPostQuery,
    private readonly registrationQuery: IRegistrationQuery,
  ) {}

  async notificationsFor({
    ctx,
    record,
    origin,
  }: {
    ctx: TransactionContext;
    record: Record;
    origin: Origin;
  }): Promise<Notification[]> {
    if (origin.type !== "tapLive") {
      return [];
    }
    const candidates = await this.candidates(ctx, record);
    const notifications = new Map<string, Notification>();
    for (const candidate of candidates) {
      if (
        candidate.recipientDid === candidate.authorDid ||
        notifications.has(candidate.recipientDid)
      ) {
        continue;
      }
      const isRecipientRegistered = await this.registrationQuery.isRegistered(
        ctx,
        candidate.recipientDid,
      );
      if (isRecipientRegistered) {
        notifications.set(candidate.recipientDid, candidate);
      }
    }
    return [...notifications.values()];
  }

  private async candidates(
    ctx: TransactionContext,
    record: Record,
  ): Promise<Notification[]> {
    switch (record.uri.collection) {
      case "app.bsky.feed.post":
        return this.postCandidates(ctx, record);
      case "app.bsky.feed.repost": {
        const repost = parseRepost(record);
        return [
          {
            recordUri: repost.uri,
            recipientDid: new AtUri(repost.subjectUri).host,
            authorDid: repost.accountDid,
            reason: "repost",
            reasonSubject: repost.subjectUri,
            sortAt: getSortAt(repost),
          },
        ];
      }
      case "app.bsky.feed.like": {
        const like = parseLike(record);
        return [
          {
            recordUri: like.uri,
            recipientDid: new AtUri(like.subjectUri).host,
            authorDid: like.accountDid,
            reason: "like",
            reasonSubject: like.subjectUri,
            sortAt: getSortAt(like),
          },
        ];
      }
      case "app.bsky.graph.follow": {
        const follow = parseFollow(record);
        return [
          {
            recordUri: follow.uri,
            recipientDid: follow.subjectDid,
            authorDid: follow.accountDid,
            reason: "follow",
            reasonSubject: null,
            sortAt: getSortAt(follow),
          },
        ];
      }
      default:
        return [];
    }
  }

  private async postCandidates(
    ctx: TransactionContext,
    record: Record,
  ): Promise<Notification[]> {
    const post = parsePost(record);
    const quoteUri = getEmbedRecordUri(post);
    const mentionDids = (
      validateRecord("app.bsky.feed.post", record).facets ?? []
    )
      .flatMap((facet) => facet.features)
      .flatMap((feature) => ("did" in feature ? [feature.did] : []));
    const replySubjects = [];
    for (
      let uri = post.replyParent?.uri ?? null;
      uri && replySubjects.length < REPLY_NOTIFICATION_DEPTH;
      uri = await this.postQuery.findReplyParentUri(ctx, uri)
    ) {
      replySubjects.push(uri);
    }
    const common = {
      recordUri: post.uri.toString(),
      authorDid: post.accountDid,
      sortAt: getSortAt(post),
    };
    return [
      ...mentionDids.map((did) => ({
        ...common,
        recipientDid: did,
        reason: "mention" as const,
        reasonSubject: null,
      })),
      ...(quoteUri?.collection === "app.bsky.feed.post"
        ? [
            {
              ...common,
              recipientDid: quoteUri.hostname,
              reason: "quote" as const,
              reasonSubject: quoteUri.toString(),
            },
          ]
        : []),
      ...replySubjects.map((uri) => ({
        ...common,
        recipientDid: uri.hostname,
        reason: "reply" as const,
        reasonSubject: uri.toString(),
      })),
    ];
  }
}

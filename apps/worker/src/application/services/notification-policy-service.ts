import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";

import type { Origin } from "../dto/origin.js";
import type { ParsedRecord } from "../dto/parsed-record.js";
import { getEmbedRecordUri, type Post } from "../dto/post.js";
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
    parsed,
    origin,
  }: {
    ctx: TransactionContext;
    parsed: ParsedRecord;
    origin: Origin;
  }): Promise<Notification[]> {
    if (origin.type !== "tapLive") {
      return [];
    }
    const candidates = await this.candidates(ctx, parsed);
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
    parsed: ParsedRecord,
  ): Promise<Notification[]> {
    switch (parsed.collection) {
      case "app.bsky.feed.post":
        return this.postCandidates(ctx, parsed);
      case "app.bsky.feed.repost": {
        const { repost } = parsed;
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
        const { like } = parsed;
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
        const { follow } = parsed;
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
      case "app.bsky.graph.listitem":
      case "app.bsky.actor.profile":
      case "app.bsky.feed.generator":
      case "app.bsky.graph.list":
      case "app.bsky.actor.link":
      case "app.bsky.feed.threadgate":
      case "app.bsky.feed.postgate":
        return [];
    }
  }

  private async postCandidates(
    ctx: TransactionContext,
    { post, mentionDids }: { post: Post; mentionDids: Did[] },
  ): Promise<Notification[]> {
    const quoteUri = getEmbedRecordUri(post);
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

import { asDid, type Did } from "@atproto/did";
import {
  asAtUriString,
  AtUri,
  type AtUriString,
  toDatetimeString,
} from "@atproto/syntax";
import type * as AppBskyNotificationGetGroupedNotifications from "@repo/client/lex/app/bsky/notification/getGroupedNotifications";

import type {
  INotificationRepository,
  NotificationItem,
  NotificationReason,
} from "../../interfaces/notification-repository.js";
import type { ISubscriptionRepository } from "../../interfaces/subscription-repository.js";
import type { GeneratorViews } from "../../views/generator-views.js";
import type { PostViews } from "../../views/post-views.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type {
  ViewContext,
  ViewContextFactory,
} from "../../views/view-context.js";

type Output = AppBskyNotificationGetGroupedNotifications.$OutputBody;
type Group = Output["groups"][number];
type RelatedView = NonNullable<Output["relatedViews"]>[number];

const FEED_REASONS: Record<string, NotificationReason[] | undefined> = {
  all: undefined,
  conversations: ["reply", "quote", "mention"],
  followers: ["follow"],
};

const ITEMS_PER_GROUP = 10;

export class UnsupportedFeedError extends Error {
  constructor(feed: string) {
    super(`feed ${feed} is not supported`);
    this.name = "UnsupportedFeedError";
  }
}

const groupKey = (item: NotificationItem) => {
  switch (item.reason) {
    case "like":
    case "repost":
      return `${item.reason}:${item.reasonSubject}`;
    case "follow":
      return "follow";
    default:
      return item.recordUri;
  }
};

const isGenerator = (uri: string) =>
  new AtUri(uri).collection === "app.bsky.feed.generator";

const defined = <T>(value: T | undefined): value is T => value !== undefined;

export class GetGroupedNotificationsUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
    private readonly postViews: PostViews,
    private readonly generatorViews: GeneratorViews,
  ) {}

  async execute(params: {
    viewerDid: Did;
    feed: string;
    limit: number;
    cursor?: string;
  }): Promise<Output> {
    if (!Object.hasOwn(FEED_REASONS, params.feed)) {
      throw new UnsupportedFeedError(params.feed);
    }
    const queryLimit = params.limit * ITEMS_PER_GROUP;
    const items = await this.notificationRepository.findMany({
      recipientDid: params.viewerDid,
      limit: queryLimit,
      cursor: params.cursor ? new Date(params.cursor) : undefined,
      reasons: FEED_REASONS[params.feed],
    });

    const grouped = new Map<string, NotificationItem[]>();
    let consumed = 0;
    for (const item of items) {
      const key = groupKey(item);
      const group = grouped.get(key);
      if (group) {
        group.push(item);
      } else if (grouped.size < params.limit) {
        grouped.set(key, [item]);
      } else {
        break;
      }
      consumed++;
    }
    const last = items[consumed - 1];
    const hasMore = consumed < items.length || items.length === queryLimit;

    const ctx = this.viewContextFactory.create({ viewerDid: params.viewerDid });
    const [built, subscription] = await Promise.all([
      Promise.all(
        [...grouped.values()].map((group) => this.toGroup(group, ctx)),
      ),
      this.subscriptionRepository.findFirst(params.viewerDid),
    ]);
    const groups = built.filter(defined);

    const relatedViews = new Map<string, RelatedView>();
    for (const { views } of groups) {
      for (const [key, view] of views) {
        relatedViews.set(key, view);
      }
    }

    return {
      cursor: hasMore && last ? last.sortAt.toISOString() : undefined,
      seenAt: subscription?.seenAt
        ? toDatetimeString(subscription.seenAt)
        : undefined,
      groups: groups.map(({ group }) => group),
      relatedViews: [...relatedViews.values()],
    };
  }

  private async toGroup(
    items: NotificationItem[],
    ctx: ViewContext,
  ): Promise<{ group: Group; views: [string, RelatedView][] } | undefined> {
    const [head] = items;
    if (!head) return undefined;
    const subjectUri = head.reasonSubject
      ? asAtUriString(head.reasonSubject)
      : undefined;
    const postUri = asAtUriString(head.recordUri);
    const [actors, subject, post] = await Promise.all([
      Promise.all(
        items
          .slice(0, ITEMS_PER_GROUP)
          .map((item) => this.profileViews.basic(asDid(item.authorDid), ctx)),
      ).then((views) => views.filter(defined)),
      subjectUri &&
        (isGenerator(subjectUri)
          ? this.generatorViews.generatorView(subjectUri, ctx)
          : this.postViews.postView(subjectUri, ctx)),
      head.reason === "like" || head.reason === "repost"
        ? undefined
        : this.postViews.postView(postUri, ctx),
    ]);
    const kind = this.toKind(
      head,
      actors.map((actor) => ({ actor: actor.did })),
      { subjectUri, subject, post },
    );
    if (actors.length === 0 || !kind) {
      return undefined;
    }
    return {
      group: {
        id: head.recordUri,
        kind,
        count: items.length,
        isRead: head.isRead,
        indexedAt: toDatetimeString(head.sortAt),
      },
      views: [
        ...actors.map((actor): [string, RelatedView] => [
          actor.did,
          { ...actor, $type: "app.bsky.actor.defs#profileViewBasic" },
        ]),
        ...[subject, post]
          .filter(defined)
          .map((view): [string, RelatedView] => [view.uri, view]),
      ],
    };
  }

  private toKind(
    head: NotificationItem,
    items: { actor: Did }[],
    refs: {
      subjectUri?: AtUriString;
      subject?: { $type: string; uri: AtUriString };
      post?: { uri: AtUriString };
    },
  ): Group["kind"] | undefined {
    const $nsid = "app.bsky.notification.getGroupedNotifications";
    const { subjectUri, subject, post } = refs;
    switch (head.reason) {
      case "like":
        if (!subject) return undefined;
        return subject.$type === "app.bsky.feed.defs#generatorView"
          ? {
              $type: `${$nsid}#generatorLikeGroup`,
              generator: subject.uri,
              items,
            }
          : { $type: `${$nsid}#likeGroup`, post: subject.uri, items };
      case "repost":
        return (
          subject && {
            $type: `${$nsid}#repostGroup`,
            post: subject.uri,
            items,
          }
        );
      case "follow":
        return { $type: `${$nsid}#followGroup`, items };
      case "reply":
        return (
          post &&
          subjectUri && {
            $type: `${$nsid}#replyNotification`,
            post: post.uri,
            parent: subjectUri,
          }
        );
      case "quote":
        return post && { $type: `${$nsid}#quoteNotification`, post: post.uri };
      case "mention":
        return (
          post && { $type: `${$nsid}#mentionNotification`, post: post.uri }
        );
    }
  }
}

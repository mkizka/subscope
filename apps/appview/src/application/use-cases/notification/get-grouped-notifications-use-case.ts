import type { Did } from "@atproto/did";
import { toDatetimeString } from "@atproto/syntax";
import type * as AppBskyNotificationGetGroupedNotifications from "@repo/client/lex/app/bsky/notification/getGroupedNotifications";

import type {
  NotificationDto,
  NotificationReason,
} from "../../dto/notification-dto.js";
import type { INotificationQuery } from "../../interfaces/notification-query.js";
import type { ISubscriptionRepository } from "../../interfaces/subscription-repository.js";
import {
  ITEMS_PER_GROUP,
  type NotificationViews,
} from "../../views/notification-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

type Output = AppBskyNotificationGetGroupedNotifications.$OutputBody;

const FEED_REASONS: Record<string, NotificationReason[] | undefined> = {
  all: undefined,
  conversations: ["reply", "quote", "mention"],
  followers: ["follow"],
};

export class UnsupportedFeedError extends Error {
  constructor(feed: string) {
    super(`feed ${feed} is not supported`);
    this.name = "UnsupportedFeedError";
  }
}

const groupKey = (item: NotificationDto) => {
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

export class GetGroupedNotificationsUseCase {
  constructor(
    private readonly notificationQuery: INotificationQuery,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly notificationViews: NotificationViews,
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
    const items = await this.notificationQuery.findNotifications({
      recipientDid: params.viewerDid,
      limit: queryLimit,
      cursor: params.cursor ? new Date(params.cursor) : undefined,
      reasons: FEED_REASONS[params.feed],
    });

    const grouped = new Map<string, NotificationDto[]>();
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
    const [views, subscription] = await Promise.all([
      Promise.all(
        [...grouped.values()].map((group) =>
          this.notificationViews.group(group, ctx),
        ),
      ),
      this.subscriptionRepository.find(params.viewerDid),
    ]);
    const groups = views.filter((view) => view !== undefined);

    return {
      cursor: hasMore && last ? last.sortAt.toISOString() : undefined,
      seenAt: subscription?.seenAt
        ? toDatetimeString(subscription.seenAt)
        : undefined,
      groups: groups.map(({ group }) => group),
      relatedViews: [
        ...new Map(groups.flatMap(({ relatedViews }) => relatedViews)).values(),
      ],
    };
  }
}

import { asDid, type Did } from "@atproto/did";
import {
  asAtUriString,
  AtUri,
  type AtUriString,
  toDatetimeString,
} from "@atproto/syntax";
import type * as AppBskyNotificationGetGroupedNotifications from "@repo/client/lex/app/bsky/notification/getGroupedNotifications";

import type { NotificationItem } from "../interfaces/notification-repository.js";
import type { GeneratorViews } from "./generator-views.js";
import type { PostViews } from "./post-views.js";
import type { ProfileViews } from "./profile-views.js";
import type { ViewContext } from "./view-context.js";

type Output = AppBskyNotificationGetGroupedNotifications.$OutputBody;
type Group = Output["groups"][number];
type RelatedView = NonNullable<Output["relatedViews"]>[number];

export const ITEMS_PER_GROUP = 10;

const $nsid = "app.bsky.notification.getGroupedNotifications";

const isGenerator = (uri: string) =>
  new AtUri(uri).collection === "app.bsky.feed.generator";

const defined = <T>(value: T | undefined): value is T => value !== undefined;

export class NotificationViews {
  constructor(
    private readonly profileViews: ProfileViews,
    private readonly postViews: PostViews,
    private readonly generatorViews: GeneratorViews,
  ) {}

  async group(
    items: NotificationItem[],
    ctx: ViewContext,
  ): Promise<
    { group: Group; relatedViews: [string, RelatedView][] } | undefined
  > {
    const [head] = items;
    if (!head) return undefined;
    const subjectUri = head.reasonSubject
      ? asAtUriString(head.reasonSubject)
      : undefined;
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
        : this.postViews.postView(head.recordUri, ctx),
    ]);
    const kind = this.kind(
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
      relatedViews: [
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

  private kind(
    head: NotificationItem,
    items: { actor: Did }[],
    refs: {
      subjectUri?: AtUriString;
      subject?: { $type: string; uri: AtUriString };
      post?: { uri: AtUriString };
    },
  ): Group["kind"] | undefined {
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

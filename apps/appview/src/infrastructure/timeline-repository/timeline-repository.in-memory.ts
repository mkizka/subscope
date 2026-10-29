import type { Did } from "@atproto/did";
import type { FeedItem } from "@repo/common/domain";

import type { ITimelineRepository } from "../../application/interfaces/timeline-repository.js";

export class InMemoryTimelineRepository implements ITimelineRepository {
  private feedItems: Map<string, FeedItem> = new Map();
  private follows: Set<string> = new Set();
  private listItems: Set<string> = new Set();

  addFeedItem(feedItem: FeedItem): void {
    this.feedItems.set(feedItem.uri.toString(), feedItem);
  }

  addFollow(actorDid: Did, subjectDid: Did): void {
    this.follows.add(`${actorDid}:${subjectDid}`);
  }

  addListItem(listUri: string, subjectDid: Did): void {
    this.listItems.add(`${listUri}:${subjectDid}`);
  }

  clear(): void {
    this.feedItems.clear();
    this.follows.clear();
    this.listItems.clear();
  }

  findFeedItems({
    viewerDid,
    cursor,
    limit,
  }: {
    viewerDid: Did;
    cursor?: Date;
    limit: number;
  }): Promise<FeedItem[]> {
    let items = Array.from(this.feedItems.values()).filter((item) => {
      const isFollowing = this.follows.has(`${viewerDid}:${item.actorDid}`);
      const isOwnItem = item.actorDid === viewerDid;

      return isFollowing || isOwnItem;
    });

    if (cursor) {
      items = items.filter((item) => item.sortAt < cursor);
    }

    return Promise.resolve(
      items
        .sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime())
        .slice(0, limit),
    );
  }

  findListFeedItems({
    listUri,
    cursor,
    limit,
  }: {
    listUri: string;
    cursor?: Date;
    limit: number;
  }): Promise<FeedItem[]> {
    return Promise.resolve(
      Array.from(this.feedItems.values())
        .filter((item) => this.listItems.has(`${listUri}:${item.actorDid}`))
        .filter((item) => !cursor || item.sortAt < cursor)
        .sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime())
        .slice(0, limit),
    );
  }
}

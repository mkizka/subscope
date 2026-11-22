import { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";

import type { Author } from "../../dto/author.js";
import { feedItemFromRepost } from "../../dto/feed-item.js";
import type { Origin } from "../../dto/origin.js";
import type { Record } from "../../dto/record.js";
import { parseRepost, type Repost } from "../../dto/repost.js";
import { getSortAt } from "../../dto/sort-at.js";
import type { IFeedItemRepository } from "../../interfaces/repositories/feed-item-repository.js";
import type { Notification } from "../../interfaces/repositories/notification-repository.js";
import type { IRepostRepository } from "../../interfaces/repositories/repost-repository.js";
import {
  type ICollectionIndexer,
  isWithinPastWindow,
} from "./collection-indexer.js";

export class RepostIndexer implements ICollectionIndexer<Repost> {
  constructor(
    private readonly repostRepository: IRepostRepository,
    private readonly feedItemRepository: IFeedItemRepository,
  ) {}

  parse(record: Record) {
    return parseRepost(record);
  }

  shouldStore({
    parsed,
    author,
    origin,
  }: {
    parsed: Repost;
    author: Author;
    origin: Origin;
  }) {
    return isWithinPastWindow(author, origin, parsed.createdAt);
  }

  async save({ ctx, parsed }: { ctx: TransactionContext; parsed: Repost }) {
    await this.repostRepository.save({ ctx, repost: parsed });
    await this.feedItemRepository.save({
      ctx,
      feedItem: feedItemFromRepost(parsed),
    });
  }

  recordsToFetch({ parsed }: { parsed: Repost }) {
    return [new AtUri(parsed.subjectUri)];
  }

  notificationCandidates({ parsed }: { parsed: Repost }): Notification[] {
    return [
      {
        recordUri: parsed.uri,
        recipientDid: new AtUri(parsed.subjectUri).host,
        authorDid: parsed.accountDid,
        reason: "repost",
        reasonSubject: parsed.subjectUri,
        sortAt: getSortAt(parsed),
      },
    ];
  }

  postsToAggregate(parsed: Repost) {
    return [new AtUri(parsed.subjectUri)];
  }
}

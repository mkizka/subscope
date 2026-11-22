import { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";

import type { Author } from "../../dto/author.js";
import { type Like, parseLike } from "../../dto/like.js";
import type { Origin } from "../../dto/origin.js";
import type { Record } from "../../dto/record.js";
import { getSortAt } from "../../dto/sort-at.js";
import type { IRegistrationQuery } from "../../interfaces/queries/registration-query.js";
import type { ILikeRepository } from "../../interfaces/repositories/like-repository.js";
import type { Notification } from "../../interfaces/repositories/notification-repository.js";
import type { ICollectionIndexer } from "./collection-indexer.js";

export class LikeIndexer implements ICollectionIndexer<Like> {
  constructor(
    private readonly likeRepository: ILikeRepository,
    private readonly registrationQuery: IRegistrationQuery,
  ) {}

  parse(record: Record) {
    return parseLike(record);
  }

  pastWindowDate(parsed: Like) {
    return parsed.createdAt;
  }

  async shouldStore({
    ctx,
    parsed,
    author,
  }: {
    ctx: TransactionContext;
    parsed: Like;
    author: Author;
  }) {
    return (
      author.isMember ||
      (await this.registrationQuery.isRegistered(
        ctx,
        new AtUri(parsed.subjectUri).host,
      ))
    );
  }

  async save({ ctx, parsed }: { ctx: TransactionContext; parsed: Like }) {
    await this.likeRepository.save({ ctx, like: parsed });
  }

  recordsToFetch({
    parsed,
    author,
    origin,
  }: {
    parsed: Like;
    author: Author;
    origin: Origin;
  }) {
    const subjectUri = new AtUri(parsed.subjectUri);
    const inWindow =
      origin.type === "tapLive" || !!author.tracking?.covers(parsed.createdAt);
    return author.isMember &&
      inWindow &&
      subjectUri.collection === "app.bsky.feed.post"
      ? [subjectUri]
      : [];
  }

  notificationCandidates({ parsed }: { parsed: Like }): Notification[] {
    return [
      {
        recordUri: parsed.uri,
        recipientDid: new AtUri(parsed.subjectUri).host,
        authorDid: parsed.accountDid,
        reason: "like",
        reasonSubject: parsed.subjectUri,
        sortAt: getSortAt(parsed),
      },
    ];
  }

  postsToAggregate(parsed: Like) {
    return [new AtUri(parsed.subjectUri)];
  }
}

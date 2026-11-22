import { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";

import type { Author } from "../dto/author.js";
import type { Origin } from "../dto/origin.js";
import type { ParsedRecord } from "../dto/parsed-record.js";
import type { Record } from "../dto/record.js";
import type { IRegistrationQuery } from "../interfaces/queries/registration-query.js";

const isGateOfSamePost = (record: Record, postUri: AtUri) =>
  postUri.host === record.uri.did &&
  postUri.collection === "app.bsky.feed.post" &&
  postUri.rkey === record.uri.rkey;

const isWithinPastWindow = (
  author: Author,
  origin: Origin,
  { createdAt }: { createdAt: Date },
) =>
  origin.type !== "tapPast" ||
  author.isMember ||
  !!author.tracking?.covers(createdAt);

export class StoragePolicyService {
  constructor(private readonly registrationQuery: IRegistrationQuery) {}

  async shouldStore({
    ctx,
    record,
    parsed,
    author,
    origin,
  }: {
    ctx: TransactionContext;
    record: Record;
    parsed: ParsedRecord;
    author: Author;
    origin: Origin;
  }): Promise<boolean> {
    switch (parsed.collection) {
      case "app.bsky.feed.post":
        return isWithinPastWindow(author, origin, parsed.post);
      case "app.bsky.feed.repost":
        return isWithinPastWindow(author, origin, parsed.repost);
      case "app.bsky.feed.like":
        return (
          isWithinPastWindow(author, origin, parsed.like) &&
          (author.isMember ||
            (await this.registrationQuery.isRegistered(
              ctx,
              new AtUri(parsed.like.subjectUri).host,
            )))
        );
      case "app.bsky.feed.threadgate":
      case "app.bsky.feed.postgate":
        return isGateOfSamePost(record, parsed.postUri);
      case "app.bsky.graph.follow":
      case "app.bsky.graph.listitem":
      case "app.bsky.actor.profile":
      case "app.bsky.feed.generator":
      case "app.bsky.graph.list":
      case "app.bsky.actor.link":
        return true;
    }
  }
}

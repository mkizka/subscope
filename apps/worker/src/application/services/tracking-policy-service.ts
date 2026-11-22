import type { Did } from "@atproto/did";

import type { Author } from "../dto/author.js";
import type { ParsedRecord } from "../dto/parsed-record.js";

export class TrackingPolicyService {
  reposToSync({
    parsed,
    author,
  }: {
    parsed: ParsedRecord;
    author: Author;
  }): Did[] {
    switch (parsed.collection) {
      case "app.bsky.graph.follow":
        return author.isMember ? [parsed.follow.subjectDid] : [];
      case "app.bsky.feed.post":
      case "app.bsky.feed.repost":
      case "app.bsky.feed.like":
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
}

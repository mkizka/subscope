import type { AtUri } from "@atproto/syntax";

import { getEmbedRecordUri, type Post } from "./post.js";
import { getSortAt } from "./sort-at.js";

export type Notification = {
  recordUri: string;
  recipientDid: string;
  authorDid: string;
  reason: "like" | "repost" | "follow" | "mention" | "reply" | "quote";
  reasonSubject: string | null;
  sortAt: Date;
};

export function postNotifications(
  post: Post,
  replyAncestorUris: AtUri[],
): Notification[] {
  const quoteUri = getEmbedRecordUri(post);
  const base = {
    recordUri: post.uri.toString(),
    authorDid: post.accountDid,
    sortAt: getSortAt(post),
  };
  return [
    ...post.mentionDids.map((did) => ({
      ...base,
      recipientDid: did,
      reason: "mention" as const,
      reasonSubject: null,
    })),
    ...(quoteUri?.collection === "app.bsky.feed.post"
      ? [
          {
            ...base,
            recipientDid: quoteUri.hostname,
            reason: "quote" as const,
            reasonSubject: quoteUri.toString(),
          },
        ]
      : []),
    ...replyAncestorUris.map((uri) => ({
      ...base,
      recipientDid: uri.hostname,
      reason: "reply" as const,
      reasonSubject: uri.toString(),
    })),
  ];
}

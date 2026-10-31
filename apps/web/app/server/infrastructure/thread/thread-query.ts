import type { AtUriString } from "@atproto/syntax";
import {
  type ThreadViewPost,
  threadViewPost,
} from "@repo/client/lex/app/bsky/feed/defs";
import getPostThread from "@repo/client/lex/app/bsky/feed/getPostThread";

import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";
import {
  type TimelinePostDto,
  toTimelinePost,
} from "@/app/server/infrastructure/timeline/timeline-query";

export interface IThreadQuery {
  findThread: (
    did: string,
    uri: AtUriString,
  ) => Promise<{
    ancestors: TimelinePostDto[];
    post: TimelinePostDto;
    replies: TimelinePostDto[][];
  } | null>;
}

export const threadQueryFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IThreadQuery => ({
  async findThread(did, uri) {
    const agent = await oauthClient.restore(did);
    if (!agent) throw new Error("OAuth session not found");
    const { thread } = await agent.call(getPostThread, { uri });
    if (!threadViewPost.matches(thread)) {
      return null;
    }
    const ancestors: ThreadViewPost[] = [];
    for (let p = thread.parent; threadViewPost.matches(p); p = p.parent) {
      ancestors.unshift(p);
    }
    const replies = (thread.replies ?? [])
      .filter((r) => threadViewPost.matches(r))
      .map((reply) => {
        const chain: ThreadViewPost[] = [];
        for (
          let p: unknown = reply;
          threadViewPost.matches(p);
          p = p.replies?.find((r) => threadViewPost.matches(r))
        ) {
          chain.push(p);
        }
        return chain;
      });
    return {
      ancestors: ancestors.map(({ post }) => toTimelinePost({ post })),
      post: toTimelinePost({ post: thread.post }),
      replies: replies.map((chain) =>
        chain.map(({ post }) => toTimelinePost({ post })),
      ),
    };
  },
});

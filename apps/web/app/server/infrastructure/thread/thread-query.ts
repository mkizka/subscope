import {
  type ThreadViewPost,
  threadViewPost,
} from "@repo/client/app/bsky/feed/defs";
import getPostThread from "@repo/client/app/bsky/feed/getPostThread";
import getQuotes from "@repo/client/app/bsky/feed/getQuotes";

import type { IOAuthClient } from "@/app/server/application/interfaces/oauth-client";
import type { IThreadQuery } from "@/app/server/application/interfaces/thread-query";
import { toTimelinePost } from "@/app/server/infrastructure/timeline/timeline-query";

export const threadQueryFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IThreadQuery => ({
  async findQuotes(did, uri, cursor) {
    const agent = await oauthClient.restore(did);
    if (!agent) throw new Error("OAuth session not found");
    const { thread } = await agent.call(getPostThread, {
      uri,
      depth: 0,
      parentHeight: 0,
    });
    if (!threadViewPost.matches(thread)) {
      throw new Error("Post not found");
    }
    const { posts, cursor: next } = await agent.call(getQuotes, {
      uri: thread.post.uri,
      cursor,
    });
    return {
      posts: posts.map((post) => toTimelinePost({ post })),
      cursor: next,
    };
  },
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

import type { AtUriString } from "@atproto/syntax";
import {
  type ThreadViewPost,
  threadViewPost,
} from "@repo/client/lex/app/bsky/feed/defs";
import getPostThread from "@repo/client/lex/app/bsky/feed/getPostThread";

import type { TimelinePost } from "@/app/features/timeline/blocks/timeline-feed";
import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";
import { toTimelinePost } from "@/app/server/infrastructure/timeline/timeline-repository";

export interface IThreadRepository {
  findThread: (
    did: string,
    uri: AtUriString,
  ) => Promise<{
    ancestors: TimelinePost[];
    post: TimelinePost;
    replies: TimelinePost[];
  } | null>;
}

export const threadRepositoryFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IThreadRepository => ({
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
    const replies = (thread.replies ?? []).filter((r) =>
      threadViewPost.matches(r),
    );
    return {
      ancestors: ancestors.map(({ post }) => toTimelinePost({ post })),
      post: toTimelinePost({ post: thread.post }),
      replies: replies.map(({ post }) => toTimelinePost({ post })),
    };
  },
});

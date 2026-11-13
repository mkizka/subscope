import type { AtUriString } from "@atproto/syntax";
import type { ProfileView } from "@repo/client/app/bsky/actor/defs";
import {
  type ThreadViewPost,
  threadViewPost,
} from "@repo/client/app/bsky/feed/defs";
import getLikes from "@repo/client/app/bsky/feed/getLikes";
import getPostThread from "@repo/client/app/bsky/feed/getPostThread";
import getQuotes from "@repo/client/app/bsky/feed/getQuotes";
import getRepostedBy from "@repo/client/app/bsky/feed/getRepostedBy";

import type { AccountDto } from "@/app/server/application/dto/account";
import type { IOAuthClient } from "@/app/server/application/interfaces/oauth-client";
import type { IThreadQuery } from "@/app/server/application/interfaces/thread-query";
import { toTimelinePost } from "@/app/server/infrastructure/timeline/timeline-query";

export const threadQueryFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IThreadQuery => {
  const restorePost = async (did: string, uri: AtUriString) => {
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
    return { agent, uri: thread.post.uri };
  };
  return {
    async findReactors(did, uri, kind, cursor) {
      const { agent, uri: postUri } = await restorePost(did, uri);
      const toAccount = ({
        did,
        handle,
        displayName,
        avatar,
        description,
      }: ProfileView): AccountDto => ({
        did,
        handle,
        displayName,
        avatarUrl: avatar,
        description,
      });
      if (kind === "liked-by") {
        const res = await agent.call(getLikes, { uri: postUri, cursor });
        return {
          accounts: res.likes.map(({ actor }) => toAccount(actor)),
          cursor: res.cursor,
        };
      }
      const res = await agent.call(getRepostedBy, { uri: postUri, cursor });
      return { accounts: res.repostedBy.map(toAccount), cursor: res.cursor };
    },
    async findQuotes(did, uri, cursor) {
      const { agent, uri: postUri } = await restorePost(did, uri);
      const { posts, cursor: next } = await agent.call(getQuotes, {
        uri: postUri,
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
  };
};

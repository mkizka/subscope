import { asAtUriString } from "@atproto/syntax";
import getPosts from "@repo/client/lex/app/bsky/feed/getPosts";

import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";

export interface IPostQuery {
  exists: (did: string, uri: string) => Promise<boolean>;
  getReplyCount: (did: string, uri: string) => Promise<number>;
}

export const postQueryFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IPostQuery => {
  const getPost = async (did: string, uri: string) => {
    const agent = await oauthClient.restore(did);
    if (!agent) throw new Error("OAuth session not found");
    const { posts } = await agent
      .call(getPosts, { uris: [asAtUriString(uri)] })
      .catch(() => ({ posts: [] }));
    return posts[0];
  };
  return {
    async exists(did, uri) {
      return !!(await getPost(did, uri));
    },
    async getReplyCount(did, uri) {
      return (await getPost(did, uri))?.replyCount ?? 0;
    },
  };
};

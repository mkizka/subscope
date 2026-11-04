import { asAtUriString } from "@atproto/syntax";
import getPosts from "@repo/client/lex/app/bsky/feed/getPosts";

import type { IOAuthClient } from "@/app/server/application/interfaces/oauth-client";
import type { IPostQuery } from "@/app/server/application/interfaces/post-query";

export const postQueryFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IPostQuery => ({
  async exists(did, uri) {
    const agent = await oauthClient.restore(did);
    if (!agent) throw new Error("OAuth session not found");
    const { posts } = await agent
      .call(getPosts, { uris: [asAtUriString(uri)] })
      .catch(() => ({ posts: [] }));
    return posts.length > 0;
  },
});

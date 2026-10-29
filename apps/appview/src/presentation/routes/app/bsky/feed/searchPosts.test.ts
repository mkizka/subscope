import searchPosts from "@repo/client/lex/app/bsky/feed/searchPosts";
import {
  actorFactory,
  postFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.feed.searchPosts", () => {
  const { ctx } = testSetup;

  test("searchPosts-1: 本文がクエリに一致する投稿をpostViewで返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const author = await actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const post = await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => author })
            .create(),
      })
      .props({ text: () => "searchPostsで探す投稿" })
      .create();

    // act
    const res = await client.call(searchPosts, { q: "searchPosts" });

    // assert
    expect(res.posts).toMatchObject([
      { uri: post.uri, author: { did: author.did } },
    ]);
  });
});

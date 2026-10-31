import searchPostsV2 from "@repo/client/lex/app/bsky/feed/searchPostsV2";
import {
  actorFactory,
  postFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.feed.searchPostsV2", () => {
  const { ctx } = testSetup;

  test("searchPostsV2-1: 本文がqueryに一致する投稿をpostViewで返す", async () => {
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
      .props({ text: () => "searchPostsV2で探す投稿" })
      .create();

    // act
    const res = await client.call(searchPostsV2, { query: "searchPostsV2" });

    // assert
    expect(res.posts).toMatchObject([
      { uri: post.uri, author: { did: author.did } },
    ]);
  });
});

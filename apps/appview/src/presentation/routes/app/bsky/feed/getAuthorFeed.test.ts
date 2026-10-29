import getAuthorFeed from "@repo/client/lex/app/bsky/feed/getAuthorFeed";
import {
  actorFactory,
  postFactory,
  postFeedItemFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.feed.getAuthorFeed", () => {
  const { ctx } = testSetup;

  test("getAuthorFeed-1: 指定したアクターの投稿をfeedViewPostで返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const author = await actorFactory(ctx.db)
      .props({ handle: () => "alice.test" })
      .use((t) => t.withProfile({}))
      .create();
    const post = await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => author })
            .create(),
      })
      .create();
    await postFeedItemFactory(ctx.db)
      .vars({ post: () => post })
      .create();

    // act
    const res = await client.call(getAuthorFeed, {
      actor: "alice.test",
    });

    // assert
    expect(res.feed).toMatchObject([
      { post: { uri: post.uri, author: { did: author.did } } },
    ]);
  });

  test("getAuthorFeed-2: 解決できないハンドルには400を返す", async () => {
    // arrange
    const { client } = await setupApiTest();

    // act
    const promise = client.call(getAuthorFeed, {
      actor: "notfound.test",
    });

    // assert
    await expect(promise).rejects.toMatchObject({ status: 400 });
  });
});

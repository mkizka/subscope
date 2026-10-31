import getAuthorFeed from "@repo/client/lex/app/bsky/feed/getAuthorFeed";
import {
  actorFactory,
  postEmbedImageFactory,
  postFactory,
  postFeedItemFactory,
  recordFactory,
  repostFactory,
  repostFeedItemFactory,
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

  test("getAuthorFeed-3: filterがposts_with_mediaのとき、画像を添付したアクター自身の投稿だけを返し、リポストは含めない", async () => {
    // arrange
    const { client } = await setupApiTest();
    const author = await actorFactory(ctx.db)
      .props({ handle: () => "alice.test" })
      .create();
    const createPost = async () => {
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
      return post;
    };
    const mediaPost = await createPost();
    await postEmbedImageFactory(ctx.db)
      .vars({ post: () => mediaPost })
      .create();
    await createPost();
    const otherMediaPost = await postFactory(ctx.db).create();
    await postEmbedImageFactory(ctx.db)
      .vars({ post: () => otherMediaPost })
      .create();
    const repost = await repostFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.repost")
            .vars({ actor: () => author })
            .create(),
        subject: () => otherMediaPost,
      })
      .create();
    await repostFeedItemFactory(ctx.db)
      .vars({ repost: () => repost })
      .create();

    // act
    const res = await client.call(getAuthorFeed, {
      actor: "alice.test",
      filter: "posts_with_media",
    });

    // assert
    expect(res.feed).toMatchObject([{ post: { uri: mediaPost.uri } }]);
  });
});

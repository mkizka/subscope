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

  type Actor = Awaited<ReturnType<ReturnType<typeof actorFactory>["create"]>>;
  type Post = Awaited<ReturnType<ReturnType<typeof postFactory>["create"]>>;

  const createPost = async (
    author: Actor,
    reply?: { parent: Post; root: Post },
  ) => {
    const post = await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => author })
            .create(),
      })
      .use((t) => (reply ? t.asReplyTo(reply.parent, reply.root) : {}))
      .create();
    await postFeedItemFactory(ctx.db)
      .vars({ post: () => post })
      .create();
    return post;
  };

  const createRepost = async (author: Actor, subject: Post) => {
    const repost = await repostFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.repost")
            .vars({ actor: () => author })
            .create(),
        subject: () => subject,
      })
      .create();
    await repostFeedItemFactory(ctx.db)
      .vars({ repost: () => repost })
      .create();
  };

  test("getAuthorFeed-3: filterがposts_with_mediaのとき、画像を添付したアクター自身の投稿だけを返し、リポストは含めない", async () => {
    // arrange
    const { client } = await setupApiTest();
    const author = await actorFactory(ctx.db)
      .props({ handle: () => "alice.test" })
      .create();
    const mediaPost = await createPost(author);
    await postEmbedImageFactory(ctx.db)
      .vars({ post: () => mediaPost })
      .create();
    await createPost(author);
    const otherMediaPost = await postFactory(ctx.db).create();
    await postEmbedImageFactory(ctx.db)
      .vars({ post: () => otherMediaPost })
      .create();
    await createRepost(author, otherMediaPost);

    // act
    const res = await client.call(getAuthorFeed, {
      actor: "alice.test",
      filter: "posts_with_media",
    });

    // assert
    expect(res.feed).toMatchObject([{ post: { uri: mediaPost.uri } }]);
  });

  test("getAuthorFeed-4: filterがposts_no_repliesのとき、リプライを含めない", async () => {
    // arrange
    const { client } = await setupApiTest();
    const author = await actorFactory(ctx.db)
      .props({ handle: () => "alice.test" })
      .create();
    const rootPost = await createPost(author);
    await createPost(author, { parent: rootPost, root: rootPost });

    // act
    const res = await client.call(getAuthorFeed, {
      actor: "alice.test",
      filter: "posts_no_replies",
    });

    // assert
    expect(res.feed).toMatchObject([{ post: { uri: rootPost.uri } }]);
  });

  test("getAuthorFeed-5: filterがposts_and_author_threadsのとき、リプライは親とルートがともにアクター自身の投稿であるものだけを含める", async () => {
    // arrange
    const { client } = await setupApiTest();
    const author = await actorFactory(ctx.db)
      .props({ handle: () => "alice.test" })
      .create();
    const other = await actorFactory(ctx.db).create();
    const rootPost = await createPost(author);
    const selfReply = await createPost(author, {
      parent: rootPost,
      root: rootPost,
    });
    const otherReply = await createPost(other, {
      parent: rootPost,
      root: rootPost,
    });
    await createPost(author, { parent: otherReply, root: rootPost });
    const otherPost = await createPost(other);
    await createPost(author, { parent: otherPost, root: otherPost });

    // act
    const res = await client.call(getAuthorFeed, {
      actor: "alice.test",
      filter: "posts_and_author_threads",
    });

    // assert
    expect(res.feed.map((item) => item.post.uri).toSorted()).toEqual(
      [rootPost.uri, selfReply.uri].toSorted(),
    );
  });

  test("getAuthorFeed-6: filterがposts_with_videoのとき、501とMethodNotImplementedを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    await actorFactory(ctx.db)
      .props({ handle: () => "alice.test" })
      .create();

    // act
    const promise = client.call(getAuthorFeed, {
      actor: "alice.test",
      filter: "posts_with_video",
    });

    // assert
    await expect(promise).rejects.toMatchObject({
      status: 501,
      error: "MethodNotImplemented",
    });
  });
});

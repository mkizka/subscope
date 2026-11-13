import getAuthorFeed from "@repo/client/app/bsky/feed/getAuthorFeed";
import {
  accountFactory,
  postEmbedImageFactory,
  postEmbedVideoFactory,
  postFactory,
  postFeedItemFactory,
  profileFactory,
  recordFactory,
  repostFactory,
  repostFeedItemFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

const pinPost = async (
  db: Parameters<typeof recordFactory>[0],
  account: { did: string },
  post: { uri: string; cid: string },
) => {
  const record = await recordFactory(db, "app.bsky.actor.profile")
    .vars({ accountDid: () => account.did })
    .props({
      uri: () => `at://${account.did}/app.bsky.actor.profile/self`,
      json: () => ({
        $type: "app.bsky.actor.profile",
        pinnedPost: { uri: post.uri, cid: post.cid },
      }),
    })
    .create();
  await profileFactory(db)
    .vars({ record: () => record })
    .create();
};

describe("app.bsky.feed.getAuthorFeed", () => {
  const { ctx } = testSetup;

  test("getAuthorFeed-1: 指定したアカウントの投稿をfeedViewPostで返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const author = await accountFactory(ctx.db)
      .props({ handle: () => "alice.test" })
      .use((t) => t.withProfile({}))
      .create();
    const post = await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ account: () => author })
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

  type Account = Awaited<
    ReturnType<ReturnType<typeof accountFactory>["create"]>
  >;
  type Post = Awaited<ReturnType<ReturnType<typeof postFactory>["create"]>>;

  const createPost = async (
    author: Account,
    reply?: { parent: Post; root: Post },
  ) => {
    const post = await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ account: () => author })
            .create(),
      })
      .use((t) => (reply ? t.asReplyTo(reply.parent, reply.root) : {}))
      .create();
    await postFeedItemFactory(ctx.db)
      .vars({ post: () => post })
      .create();
    return post;
  };

  const createRepost = async (author: Account, subject: Post) => {
    const repost = await repostFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.repost")
            .vars({ account: () => author })
            .create(),
        subject: () => subject,
      })
      .create();
    await repostFeedItemFactory(ctx.db)
      .vars({ repost: () => repost })
      .create();
  };

  test("getAuthorFeed-3: filterがposts_with_mediaのとき、画像を添付したアカウント自身の投稿だけを返し、リポストは含めない", async () => {
    // arrange
    const { client } = await setupApiTest();
    const author = await accountFactory(ctx.db)
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
    const author = await accountFactory(ctx.db)
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

  test("getAuthorFeed-5: filterがposts_and_author_threadsのとき、リプライは親とルートがともにアカウント自身の投稿であるものだけを含める", async () => {
    // arrange
    const { client } = await setupApiTest();
    const author = await accountFactory(ctx.db)
      .props({ handle: () => "alice.test" })
      .create();
    const other = await accountFactory(ctx.db).create();
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

  test("getAuthorFeed-6: filterがposts_with_videoのとき、動画を添付したアカウント自身の投稿だけを返し、リポストは含めない", async () => {
    // arrange
    const { client } = await setupApiTest();
    const author = await accountFactory(ctx.db)
      .props({ handle: () => "alice.test" })
      .create();
    const videoPost = await createPost(author);
    await postEmbedVideoFactory(ctx.db)
      .vars({ post: () => videoPost })
      .create();
    const imagePost = await createPost(author);
    await postEmbedImageFactory(ctx.db)
      .vars({ post: () => imagePost })
      .create();
    const otherVideoPost = await postFactory(ctx.db).create();
    await postEmbedVideoFactory(ctx.db)
      .vars({ post: () => otherVideoPost })
      .create();
    await createRepost(author, otherVideoPost);

    // act
    const res = await client.call(getAuthorFeed, {
      actor: "alice.test",
      filter: "posts_with_video",
    });

    // assert
    expect(res.feed).toMatchObject([{ post: { uri: videoPost.uri } }]);
  });

  test("getAuthorFeed-7: includePinsがtrueで1ページ目のとき、プロフィールのピン留め投稿を先頭にreasonPin付きで返し、元の位置からは除く", async () => {
    // arrange
    const { client } = await setupApiTest();
    const author = await accountFactory(ctx.db)
      .props({ handle: () => "alice.test" })
      .create();
    const pinned = await createPost(author);
    const newer = await createPost(author);
    await pinPost(ctx.db, author, pinned);

    // act
    const res = await client.call(getAuthorFeed, {
      actor: "alice.test",
      includePins: true,
    });
    const withoutPins = await client.call(getAuthorFeed, {
      actor: "alice.test",
    });

    // assert
    expect(res.feed.map((item) => item.post.uri)).toEqual([
      pinned.uri,
      newer.uri,
    ]);
    expect(res.feed[0]?.reason?.$type).toBe("app.bsky.feed.defs#reasonPin");
    expect(res.feed[1]?.reason).toBeUndefined();
    expect(withoutPins.feed.map((item) => item.post.uri).toSorted()).toEqual(
      [pinned.uri, newer.uri].toSorted(),
    );
    expect(withoutPins.feed.every((item) => !item.reason)).toBe(true);
  });

  test("getAuthorFeed-8: cursorがあるページと、アカウント以外の投稿がピン留めされている場合は、ピン留め投稿を先頭に入れない", async () => {
    // arrange
    const { client } = await setupApiTest();
    const author = await accountFactory(ctx.db)
      .props({ handle: () => "alice.test" })
      .create();
    const bob = await accountFactory(ctx.db)
      .props({ handle: () => "bob.test" })
      .create();
    const other = await postFactory(ctx.db).create();
    const own = await createPost(author);
    const bobPost = await createPost(bob);
    await pinPost(ctx.db, bob, other);

    // act
    const notOwn = await client.call(getAuthorFeed, {
      actor: "bob.test",
      includePins: true,
    });
    await pinPost(ctx.db, author, own);
    const paged = await client.call(getAuthorFeed, {
      actor: "alice.test",
      includePins: true,
      cursor: new Date(Date.now() + 60_000).toISOString(),
    });

    // assert
    expect(notOwn.feed.map((item) => item.post.uri)).toEqual([bobPost.uri]);
    expect(paged.feed.map((item) => item.post.uri)).toEqual([own.uri]);
    expect(paged.feed[0]?.reason).toBeUndefined();
  });
});

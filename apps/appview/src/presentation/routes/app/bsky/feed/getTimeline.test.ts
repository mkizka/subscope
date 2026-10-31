import getTimeline from "@repo/client/lex/app/bsky/feed/getTimeline";
import {
  actorFactory,
  followFactory,
  postFactory,
  postFeedItemFactory,
  recordFactory,
  repostFactory,
  repostFeedItemFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.feed.getTimeline", () => {
  const { ctx } = testSetup;

  type Actor = Awaited<ReturnType<ReturnType<typeof actorFactory>["create"]>>;

  const createActor = () =>
    actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();

  const follow = (actor: Actor, followee: Actor) =>
    followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actor: () => actor })
            .create(),
        followee: () => followee,
      })
      .create();

  type ReplyTo = { uri: string; cid: string };

  const createPost = async (
    actor: Actor,
    createdAt = new Date(),
    replyTo?: [parent: ReplyTo, root?: ReplyTo],
  ) => {
    const post = await postFactory(ctx.db)
      .use((t) => (replyTo ? t.asReplyTo(...replyTo) : {}))
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => actor })
            .create(),
      })
      .props({ createdAt: () => createdAt })
      .create();
    await postFeedItemFactory(ctx.db)
      .vars({ post: () => post })
      .create();
    return post;
  };

  const createRepost = async (actor: Actor) => {
    const subject = await createPost(await createActor());
    const repost = await repostFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.repost")
            .vars({ actor: () => actor })
            .create(),
        subject: () => subject,
      })
      .create();
    await repostFeedItemFactory(ctx.db)
      .vars({ repost: () => repost })
      .create();
    return repost;
  };

  test("getTimeline-1: 認証がないリクエストには401を返す", async () => {
    // arrange
    const { client } = await setupApiTest();

    // act
    const promise = client.call(getTimeline);

    // assert
    await expect(promise).rejects.toMatchObject({ status: 401 });
  });

  test("getTimeline-2: 閲覧者本人とフォロイーの投稿・リポストを含める", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await createActor();
    const followee = await createActor();
    await follow(viewer, followee);
    const ownPost = await createPost(viewer);
    const followeePost = await createPost(followee);
    const followeeRepost = await createRepost(followee);
    loginAs(viewer.did);

    // act
    const res = await client.call(getTimeline);

    // assert
    expect(res.feed).toHaveLength(3);
    expect(res.feed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          post: expect.objectContaining({ uri: ownPost.uri }),
        }),
        expect.objectContaining({
          post: expect.objectContaining({ uri: followeePost.uri }),
        }),
        expect.objectContaining({
          post: expect.objectContaining({ uri: followeeRepost.subjectUri }),
          reason: expect.objectContaining({
            by: expect.objectContaining({ did: followee.did }),
          }),
        }),
      ]),
    );
  });

  test("getTimeline-3: フォロイー以外の投稿・リポストは含めない", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await createActor();
    const stranger = await createActor();
    await createPost(stranger);
    await createRepost(stranger);
    loginAs(viewer.did);

    // act
    const res = await client.call(getTimeline);

    // assert
    expect(res.feed).toEqual([]);
  });

  test("getTimeline-4: 新しい順に並べ、cursorを指定するとそれより古いものだけを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await createActor();
    const oldPost = await createPost(viewer, new Date("2024-01-01"));
    const middlePost = await createPost(viewer, new Date("2024-01-02"));
    const newPost = await createPost(viewer, new Date("2024-01-03"));
    loginAs(viewer.did);

    // act
    const firstPage = await client.call(getTimeline, { limit: 2 });
    const secondPage = await client.call(getTimeline, {
      limit: 2,
      cursor: firstPage.cursor,
    });

    // assert
    expect(firstPage.feed.map((item) => item.post.uri)).toEqual([
      newPost.uri,
      middlePost.uri,
    ]);
    expect(secondPage.feed.map((item) => item.post.uri)).toEqual([oldPost.uri]);
  });

  test("getTimeline-5: 投稿者にプロフィールレコードがなくても投稿を含め、authorはDIDとハンドルだけにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await createActor();
    const followee = await actorFactory(ctx.db).create();
    await follow(viewer, followee);
    const post = await createPost(followee);
    loginAs(viewer.did);

    // act
    const res = await client.call(getTimeline);

    // assert
    expect(res.feed).toMatchObject([
      {
        post: {
          uri: post.uri,
          author: { did: followee.did, handle: followee.handle },
        },
      },
    ]);
  });

  test("feedViewPost-1: リプライには、スレッドの起点と親の投稿をreplyに含める", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await createActor();
    const root = await createPost(viewer, new Date("2024-01-01"));
    const parent = await createPost(viewer, new Date("2024-01-02"), [root]);
    await createPost(viewer, new Date("2024-01-03"), [parent, root]);
    loginAs(viewer.did);

    // act
    const res = await client.call(getTimeline, { limit: 1 });

    // assert
    expect(res.feed).toMatchObject([
      {
        reply: {
          root: { $type: "app.bsky.feed.defs#postView", uri: root.uri },
          parent: { $type: "app.bsky.feed.defs#postView", uri: parent.uri },
        },
      },
    ]);
  });

  test("feedViewPost-2: 起点や親の投稿が見つからない場合、replyのその投稿をnotFoundPostにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await createActor();
    const missing = {
      uri: `at://${viewer.did}/app.bsky.feed.post/missing`,
      cid: "bafyreimissing",
    };
    await createPost(viewer, new Date(), [missing]);
    loginAs(viewer.did);

    // act
    const res = await client.call(getTimeline);

    // assert
    const notFoundPost = {
      $type: "app.bsky.feed.defs#notFoundPost",
      uri: missing.uri,
      notFound: true,
    };
    expect(res.feed).toMatchObject([
      { reply: { root: notFoundPost, parent: notFoundPost } },
    ]);
  });

  test("feedViewPost-3: リポストには、リポストしたアカウントとリポストの日時をreasonに含める", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await createActor();
    const repost = await createRepost(viewer);
    loginAs(viewer.did);

    // act
    const res = await client.call(getTimeline);

    // assert
    expect(res.feed).toMatchObject([
      {
        post: { uri: repost.subjectUri },
        reason: {
          $type: "app.bsky.feed.defs#reasonRepost",
          by: { did: viewer.did },
          indexedAt: repost.indexedAt.toISOString(),
        },
      },
    ]);
  });
});

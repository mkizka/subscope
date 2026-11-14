import { asAtIdentifierString, asAtUriString } from "@atproto/syntax";
import getProfile from "@repo/client/app/bsky/actor/getProfile";
import getPosts from "@repo/client/app/bsky/feed/getPosts";
import getTimeline from "@repo/client/app/bsky/feed/getTimeline";
import {
  accountFactory,
  blockFactory,
  followFactory,
  postFactory,
  recordFactory,
  repostFactory,
  repostFeedItemFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../shared/api-test-utils.js";

describe("ブロック", () => {
  const { ctx } = testSetup;

  type Account = Awaited<ReturnType<typeof createAccount>>;

  const createAccount = () =>
    accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();

  const createBlock = (account: Account, subject: Account) =>
    blockFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.block")
            .vars({ account: () => account })
            .create(),
        subject: () => subject,
      })
      .create();

  const createFollow = (account: Account, followee: Account) =>
    followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ account: () => account })
            .create(),
        followee: () => followee,
      })
      .create();

  const createPost = (account: Account) =>
    postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ account: () => account })
            .create(),
      })
      .create();

  const fetchViewer = async (viewer: Account, subject: Account) => {
    const { client, loginAs } = await setupApiTest();
    loginAs(viewer.did);
    const res = await client.call(getProfile, {
      actor: asAtIdentifierString(subject.did),
    });
    return res.viewer;
  };

  test("block-1: 閲覧者がブロックしているアカウントには、ブロックレコードのURIを viewer.blocking に入れる", async () => {
    // arrange
    const viewer = await createAccount();
    const subject = await createAccount();
    const block = await createBlock(viewer, subject);

    // act
    const result = await fetchViewer(viewer, subject);

    // assert
    expect(result?.blocking).toBe(block.uri);
    expect(result?.blockedBy).toBe(false);
  });

  test("block-2: 閲覧者をブロックしているアカウントには、viewer.blockedBy を true にする", async () => {
    // arrange
    const viewer = await createAccount();
    const subject = await createAccount();
    await createBlock(subject, viewer);

    // act
    const result = await fetchViewer(viewer, subject);

    // assert
    expect(result?.blockedBy).toBe(true);
    expect(result?.blocking).toBeUndefined();
  });

  test("block-3: どちらかの向きにブロックがあるアカウントには、viewer.following と viewer.followedBy を含めない", async () => {
    // arrange
    const viewer = await createAccount();
    const blocked = await createAccount();
    const blocker = await createAccount();
    for (const other of [blocked, blocker]) {
      await createFollow(viewer, other);
      await createFollow(other, viewer);
    }
    await createBlock(viewer, blocked);
    await createBlock(blocker, viewer);

    // act
    const results = [
      await fetchViewer(viewer, blocked),
      await fetchViewer(viewer, blocker),
    ];

    // assert
    for (const result of results) {
      expect(result?.following).toBeUndefined();
      expect(result?.followedBy).toBeUndefined();
    }
  });

  test("block-4: どちらかの向きにブロックがあるアカウントの投稿は応答に含めない", async () => {
    // arrange
    const viewer = await createAccount();
    const blocked = await createAccount();
    const blocker = await createAccount();
    const posts = [await createPost(blocked), await createPost(blocker)];
    const visiblePost = await createPost(await createAccount());
    await createBlock(viewer, blocked);
    await createBlock(blocker, viewer);
    const { client, loginAs } = await setupApiTest();
    loginAs(viewer.did);

    // act
    const res = await client.call(getPosts, {
      uris: [...posts, visiblePost].map((post) => asAtUriString(post.uri)),
    });

    // assert
    expect(res.posts.map((post) => post.uri)).toEqual([visiblePost.uri]);
  });

  test("block-5: どちらかの向きにブロックがあるアカウントのリポストは応答に含めない", async () => {
    // arrange
    const viewer = await createAccount();
    const blocked = await createAccount();
    const blocker = await createAccount();
    for (const other of [blocked, blocker]) {
      await createFollow(viewer, other);
      const repost = await repostFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.feed.repost")
              .vars({ account: () => other })
              .create(),
          subject: () => createPost(viewer),
        })
        .create();
      await repostFeedItemFactory(ctx.db)
        .vars({ repost: () => repost })
        .create();
    }
    await createBlock(viewer, blocked);
    await createBlock(blocker, viewer);
    const { client, loginAs } = await setupApiTest();
    loginAs(viewer.did);

    // act
    const res = await client.call(getTimeline);

    // assert
    expect(res.feed).toEqual([]);
  });
});

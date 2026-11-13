import { asAtUriString } from "@atproto/syntax";
import getQuotes from "@repo/client/app/bsky/feed/getQuotes";
import {
  accountFactory,
  followFactory,
  postEmbedRecordFactory,
  postFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.feed.getQuotes", () => {
  const { ctx } = testSetup;

  const quote = async (
    embeddedPost: Awaited<ReturnType<ReturnType<typeof postFactory>["create"]>>,
    date: Date,
  ) => {
    const post = await postFactory(ctx.db)
      .props({ createdAt: () => date, indexedAt: () => date })
      .create();
    await postEmbedRecordFactory(ctx.db)
      .vars({ post: () => post, embeddedPost: () => embeddedPost })
      .create();
    return post;
  };

  test("getQuotes-1: 指定した投稿を引用した投稿をpostViewで返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const target = await postFactory(ctx.db).create();
    const quotePost = await quote(target, new Date("2024-01-01"));
    await postFactory(ctx.db).create();

    // act
    const res = await client.call(getQuotes, {
      uri: asAtUriString(target.uri),
    });

    // assert
    expect(res).toMatchObject({
      uri: target.uri,
      posts: [{ uri: quotePost.uri }],
    });
  });

  test("getQuotes-2: 新しい順に並べ、cursorを指定するとそれより古いものだけを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const target = await postFactory(ctx.db).create();
    const oldPost = await quote(target, new Date("2024-01-01"));
    const middlePost = await quote(target, new Date("2024-01-02"));
    const newPost = await quote(target, new Date("2024-01-03"));

    // act
    const firstPage = await client.call(getQuotes, {
      uri: asAtUriString(target.uri),
      limit: 2,
    });
    const secondPage = await client.call(getQuotes, {
      uri: asAtUriString(target.uri),
      limit: 2,
      cursor: firstPage.cursor,
    });

    // assert
    expect(firstPage.posts.map((p) => p.uri)).toEqual([
      newPost.uri,
      middlePost.uri,
    ]);
    expect(secondPage.posts.map((p) => p.uri)).toEqual([oldPost.uri]);
  });

  test("getQuotes-3: 閲覧者がフォローしているアカウントの投稿には、author.viewer.followingを含める", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await accountFactory(ctx.db).create();
    const author = await accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const target = await postFactory(ctx.db).create();
    const quotePost = await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ account: () => author })
            .create(),
      })
      .create();
    await postEmbedRecordFactory(ctx.db)
      .vars({ post: () => quotePost, embeddedPost: () => target })
      .create();
    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ account: () => viewer })
            .create(),
        followee: () => author,
      })
      .create();
    loginAs(viewer.did);

    // act
    const res = await client.call(getQuotes, {
      uri: asAtUriString(target.uri),
    });

    // assert
    expect(res.posts[0]?.author.viewer?.following).toBeDefined();
  });
});

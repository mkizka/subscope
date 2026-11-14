import { asDid } from "@atproto/did";
import searchPostsV2 from "@repo/client/app/bsky/feed/searchPostsV2";
import {
  accountFactory,
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
    const author = await accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const post = await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ account: () => author })
            .create(),
      })
      .props({ text: () => "searchPostsV2で探す投稿 foo" })
      .create();

    // act
    const res = await client.call(searchPostsV2, {
      query: "  foo searchPostsV2 ",
    });

    // assert
    expect(res.posts).toMatchObject([
      { uri: post.uri, author: { did: author.did } },
    ]);
  });

  test("searchPostsV2-2: queryを省略した場合、authorsで絞り込んだ投稿を返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const author = await accountFactory(ctx.db).create();
    const other = await accountFactory(ctx.db).create();
    const create = (account: typeof author) =>
      postFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.feed.post")
              .vars({ account: () => account })
              .create(),
        })
        .create();
    const post = await create(author);
    await create(other);

    // act
    const res = await client.call(searchPostsV2, {
      authors: [asDid(author.did)],
      sort: "recent",
      allTime: true,
      limit: 25,
    });

    // assert
    expect(res.posts.map((p) => p.uri)).toEqual([post.uri]);
  });

  test("searchPostsV2-3: repliesOnlyがtrueなら返信だけ、excludeRepliesがtrueなら返信以外だけを返す。どちらも無ければ返信も含める", async () => {
    // arrange
    const { client } = await setupApiTest();
    const author = await accountFactory(ctx.db).create();
    const create = (props: object) =>
      postFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.feed.post")
              .vars({ account: () => author })
              .create(),
        })
        .props(props)
        .create();
    const root = await create({});
    const reply = await create({
      replyParentUri: () => root.uri,
      replyParentCid: () => root.cid,
      replyRootUri: () => root.uri,
      replyRootCid: () => root.cid,
    });

    // act
    const replies = await client.call(searchPostsV2, {
      authors: [asDid(author.did)],
      repliesOnly: true,
    });
    const notReplies = await client.call(searchPostsV2, {
      authors: [asDid(author.did)],
      excludeReplies: true,
    });
    const both = await client.call(searchPostsV2, {
      authors: [asDid(author.did)],
    });

    // assert
    expect(replies.posts.map((p) => p.uri)).toEqual([reply.uri]);
    expect(notReplies.posts.map((p) => p.uri)).toEqual([root.uri]);
    expect(both.posts.map((p) => p.uri).sort()).toEqual(
      [root.uri, reply.uri].sort(),
    );
  });

  test("searchPostsV2-4: queryもauthorsも無い場合、空の配列を返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    await postFactory(ctx.db).create();

    // act
    const res = await client.call(searchPostsV2, { repliesOnly: true });

    // assert
    expect(res.posts).toEqual([]);
  });

  test("searchPostsV2-6: queryに`from:me`が含まれる場合、それを語として扱わず、閲覧者をauthorsに加える", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await accountFactory(ctx.db).create();
    const other = await accountFactory(ctx.db).create();
    const create = (account: typeof viewer) =>
      postFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.feed.post")
              .vars({ account: () => account })
              .create(),
        })
        .props({ text: () => "hello" })
        .create();
    const post = await create(viewer);
    await create(other);
    loginAs(viewer.did);

    // act
    const res = await client.call(searchPostsV2, { query: "from:me hello" });

    // assert
    expect(res.posts.map((p) => p.uri)).toEqual([post.uri]);
  });

  test("searchPostsV2-7: 未ログインで`from:me`を含むqueryの場合、空の配列を返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    await postFactory(ctx.db)
      .props({ text: () => "hello" })
      .create();

    // act
    const res = await client.call(searchPostsV2, { query: "from:me hello" });

    // assert
    expect(res.posts).toEqual([]);
  });
});

import searchPosts from "@repo/client/app/bsky/feed/searchPosts";
import {
  accountFactory,
  followFactory,
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
      .props({ text: () => "searchPostsで探す投稿" })
      .create();

    // act
    const res = await client.call(searchPosts, { q: "searchPosts" });

    // assert
    expect(res.posts).toMatchObject([
      { uri: post.uri, author: { did: author.did } },
    ]);
  });

  test("searchPosts-2: 閲覧者がフォローしているアカウントの投稿には、author.viewer.followingを含める", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await accountFactory(ctx.db).create();
    const author = await accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ account: () => author })
            .create(),
      })
      .props({ text: () => "viewerで探す投稿" })
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
    const res = await client.call(searchPosts, { q: "viewerで探す" });

    // assert
    expect(res.posts[0]?.author.viewer?.following).toBeDefined();
  });
});

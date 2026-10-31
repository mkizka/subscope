import { asAtUriString } from "@atproto/syntax";
import getPosts from "@repo/client/lex/app/bsky/feed/getPosts";
import {
  actorFactory,
  likeFactory,
  postFactory,
  recordFactory,
  repostFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.feed.getPosts", () => {
  const { ctx } = testSetup;

  const createPost = () =>
    postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({
              actor: () =>
                actorFactory(ctx.db)
                  .use((t) => t.withProfile({}))
                  .create(),
            })
            .create(),
      })
      .create();

  test("getPosts-1: 指定したURIの順に投稿を並べる", async () => {
    // arrange
    const { client } = await setupApiTest();
    const first = await createPost();
    const second = await createPost();

    // act
    const res = await client.call(getPosts, {
      uris: [asAtUriString(second.uri), asAtUriString(first.uri)],
    });

    // assert
    expect(res.posts.map((post) => post.uri)).toEqual([second.uri, first.uri]);
  });

  test("getPosts-2: 存在しない投稿は含めない", async () => {
    // arrange
    const { client } = await setupApiTest();
    const post = await createPost();

    // act
    const res = await client.call(getPosts, {
      uris: [
        "at://did:plc:notfound/app.bsky.feed.post/notfound",
        asAtUriString(post.uri),
      ],
    });

    // assert
    expect(res.posts.map((post) => post.uri)).toEqual([post.uri]);
  });

  test("getPosts-3: 閲覧者がいいね・リポストした投稿は、そのURIをviewer.likeとviewer.repostに含める", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await actorFactory(ctx.db).create();
    const post = await createPost();
    const like = await likeFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ actor: () => viewer })
            .create(),
        subject: () => post,
      })
      .create();
    const repost = await repostFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.repost")
            .vars({ actor: () => viewer })
            .create(),
        subject: () => post,
      })
      .create();
    loginAs(viewer.did);

    // act
    const res = await client.call(getPosts, {
      uris: [asAtUriString(post.uri)],
    });

    // assert
    expect(res.posts).toMatchObject([
      { viewer: { like: like.uri, repost: repost.uri } },
    ]);
  });
});

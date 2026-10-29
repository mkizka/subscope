import {
  actorFactory,
  likeFactory,
  postFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.feed.getActorLikes", () => {
  const { ctx } = testSetup;

  test("getActorLikes-1: いいねした投稿がある場合、その投稿をfeedViewPostとして返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const actor = await actorFactory(ctx.db).create();
    const author = await actorFactory(ctx.db)
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
    await likeFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ actor: () => actor })
            .create(),
        subject: () => post,
      })
      .create();

    // act
    const res = await client.app.bsky.feed.getActorLikes({ actor: actor.did });

    // assert
    expect(res.data.feed).toMatchObject([
      { post: { uri: post.uri, author: { did: author.did } } },
    ]);
  });
});

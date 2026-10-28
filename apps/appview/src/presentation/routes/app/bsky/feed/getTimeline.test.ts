import {
  actorFactory,
  followFactory,
  postFactory,
  postFeedItemFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.feed.getTimeline", () => {
  const { ctx } = testSetup;

  test("認証がない場合、401を返す", async () => {
    // arrange
    const { client } = await setupApiTest();

    // act
    const promise = client.app.bsky.feed.getTimeline();

    // assert
    await expect(promise).rejects.toMatchObject({ status: 401 });
  });

  test("フォロイーの投稿がある場合、feedViewPostとして返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await actorFactory(ctx.db).create();
    const followee = await actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actor: () => viewer })
            .create(),
        followee: () => followee,
      })
      .create();
    const post = await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => followee })
            .create(),
      })
      .create();
    await postFeedItemFactory(ctx.db)
      .vars({ post: () => post })
      .create();
    loginAs(viewer.did);

    // act
    const res = await client.app.bsky.feed.getTimeline();

    // assert
    expect(res.data.feed).toMatchObject([
      { post: { uri: post.uri, author: { did: followee.did } } },
    ]);
  });
});

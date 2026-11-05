import { asAtIdentifierString } from "@atproto/syntax";
import getActorLikes from "@repo/client/app/bsky/feed/getActorLikes";
import {
  accountFactory,
  likeFactory,
  postFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.feed.getActorLikes", () => {
  const { ctx } = testSetup;

  test("getActorLikes-1: 指定したアカウントがいいねした投稿をfeedViewPostで返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const account = await accountFactory(ctx.db).create();
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
      .create();
    await likeFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ account: () => account })
            .create(),
        subject: () => post,
      })
      .create();

    // act
    const res = await client.call(getActorLikes, {
      actor: asAtIdentifierString(account.did),
    });

    // assert
    expect(res.feed).toMatchObject([
      { post: { uri: post.uri, author: { did: author.did } } },
    ]);
  });
});

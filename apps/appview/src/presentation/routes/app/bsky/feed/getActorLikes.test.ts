import { asAtIdentifierString } from "@atproto/syntax";
import getActorLikes from "@repo/client/lex/app/bsky/feed/getActorLikes";
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

  test("getActorLikes-1: 指定したアクターがいいねした投稿をfeedViewPostで返す", async () => {
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
    const res = await client.call(getActorLikes, {
      actor: asAtIdentifierString(actor.did),
    });

    // assert
    expect(res.feed).toMatchObject([
      { post: { uri: post.uri, author: { did: author.did } } },
    ]);
  });
});

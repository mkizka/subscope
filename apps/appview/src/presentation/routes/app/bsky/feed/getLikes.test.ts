import { asAtUriString } from "@atproto/syntax";
import getLikes from "@repo/client/lex/app/bsky/feed/getLikes";
import {
  actorFactory,
  likeFactory,
  postFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.feed.getLikes", () => {
  const { ctx } = testSetup;

  test("getLikes-1: 指定した投稿にいいねしたアクターをprofileViewで返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const post = await postFactory(ctx.db).create();
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
    const res = await client.call(getLikes, { uri: asAtUriString(post.uri) });

    // assert
    expect(res).toMatchObject({
      uri: post.uri,
      likes: [{ actor: { did: actor.did } }],
    });
  });
});

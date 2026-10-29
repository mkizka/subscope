import { asAtUriString } from "@atproto/syntax";
import getRepostedBy from "@repo/client/lex/app/bsky/feed/getRepostedBy";
import {
  actorFactory,
  postFactory,
  recordFactory,
  repostFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.feed.getRepostedBy", () => {
  const { ctx } = testSetup;

  test("getRepostedBy-1: 指定した投稿をリポストしたアクターをprofileViewで返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const post = await postFactory(ctx.db).create();
    await repostFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.repost")
            .vars({ actor: () => actor })
            .create(),
        subject: () => post,
      })
      .create();

    // act
    const res = await client.call(getRepostedBy, {
      uri: asAtUriString(post.uri),
    });

    // assert
    expect(res).toMatchObject({
      uri: post.uri,
      repostedBy: [{ did: actor.did }],
    });
  });
});

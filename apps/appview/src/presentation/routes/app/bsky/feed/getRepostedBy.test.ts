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

  test("getRepostedBy-2: 新しい順に並べ、cursorを指定するとそれより古いものだけを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const post = await postFactory(ctx.db).create();
    const create = async (date: Date) => {
      const actor = await actorFactory(ctx.db).create();
      await repostFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.feed.repost")
              .vars({ actor: () => actor })
              .create(),
          subject: () => post,
        })
        .props({ createdAt: () => date, indexedAt: () => date })
        .create();
      return actor;
    };
    const oldActor = await create(new Date("2024-01-01"));
    const middleActor = await create(new Date("2024-01-02"));
    const newActor = await create(new Date("2024-01-03"));

    // act
    const firstPage = await client.call(getRepostedBy, {
      uri: asAtUriString(post.uri),
      limit: 2,
    });
    const secondPage = await client.call(getRepostedBy, {
      uri: asAtUriString(post.uri),
      limit: 2,
      cursor: firstPage.cursor,
    });

    // assert
    expect(firstPage.repostedBy.map((a) => a.did)).toEqual([
      newActor.did,
      middleActor.did,
    ]);
    expect(secondPage.repostedBy.map((a) => a.did)).toEqual([oldActor.did]);
  });
});

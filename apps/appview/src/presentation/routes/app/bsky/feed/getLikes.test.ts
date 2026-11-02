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

  test("getLikes-2: 新しい順に並べ、cursorを指定するとそれより古いものだけを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const post = await postFactory(ctx.db).create();
    const create = async (date: Date) => {
      const actor = await actorFactory(ctx.db).create();
      await likeFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.feed.like")
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
    const firstPage = await client.call(getLikes, {
      uri: asAtUriString(post.uri),
      limit: 2,
    });
    const secondPage = await client.call(getLikes, {
      uri: asAtUriString(post.uri),
      limit: 2,
      cursor: firstPage.cursor,
    });

    // assert
    expect(firstPage.likes.map((l) => l.actor.did)).toEqual([
      newActor.did,
      middleActor.did,
    ]);
    expect(secondPage.likes.map((l) => l.actor.did)).toEqual([oldActor.did]);
  });
});

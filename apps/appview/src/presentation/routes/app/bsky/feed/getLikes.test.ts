import { asAtUriString } from "@atproto/syntax";
import getLikes from "@repo/client/lex/app/bsky/feed/getLikes";
import {
  accountFactory,
  likeFactory,
  postFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.feed.getLikes", () => {
  const { ctx } = testSetup;

  test("getLikes-1: 指定した投稿にいいねしたアカウントをprofileViewで返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const account = await accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const post = await postFactory(ctx.db).create();
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
    const res = await client.call(getLikes, { uri: asAtUriString(post.uri) });

    // assert
    expect(res).toMatchObject({
      uri: post.uri,
      likes: [{ actor: { did: account.did } }],
    });
  });

  test("getLikes-2: 新しい順に並べ、cursorを指定するとそれより古いものだけを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const post = await postFactory(ctx.db).create();
    const create = async (date: Date) => {
      const account = await accountFactory(ctx.db).create();
      await likeFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.feed.like")
              .vars({ account: () => account })
              .create(),
          subject: () => post,
        })
        .props({ createdAt: () => date, indexedAt: () => date })
        .create();
      return account;
    };
    const oldAccount = await create(new Date("2024-01-01"));
    const middleAccount = await create(new Date("2024-01-02"));
    const newAccount = await create(new Date("2024-01-03"));

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
      newAccount.did,
      middleAccount.did,
    ]);
    expect(secondPage.likes.map((l) => l.actor.did)).toEqual([oldAccount.did]);
  });
});

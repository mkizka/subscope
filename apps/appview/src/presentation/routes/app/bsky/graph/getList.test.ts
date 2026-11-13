import { asAtUriString } from "@atproto/syntax";
import getList from "@repo/client/app/bsky/graph/getList";
import {
  accountFactory,
  followFactory,
  listFactory,
  listItemFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.graph.getList", () => {
  const { ctx } = testSetup;

  test("getList-1: 指定したリストのlistViewと、リストに追加されたアカウントのprofileViewをitemsで返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const creator = await accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const list = await listFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.list")
            .vars({ accountDid: () => creator.did })
            .create(),
      })
      .create();
    const subject = await accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const listItem = await listItemFactory(ctx.db)
      .vars({ list: () => list, subject: () => subject })
      .create();

    // act
    const res = await client.call(getList, { list: asAtUriString(list.uri) });

    // assert
    expect(res.list).toMatchObject({
      uri: list.uri,
      name: list.name,
      creator: { did: creator.did },
    });
    expect(res.items).toMatchObject([
      { uri: listItem.uri, subject: { did: subject.did } },
    ]);
  });

  test("getList-2: 保存されていないリストには400を返す", async () => {
    // arrange
    const { client } = await setupApiTest();

    // act
    const promise = client.call(getList, {
      list: "at://did:plc:notfound/app.bsky.graph.list/notfound",
    });

    // assert
    await expect(promise).rejects.toMatchObject({ status: 400 });
  });

  test("getList-3: 認証した場合、閲覧者がフォローしているアカウントはviewer.followingを含める", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await accountFactory(ctx.db).create();
    const list = await listFactory(ctx.db).create();
    const subject = await accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    await listItemFactory(ctx.db)
      .vars({ list: () => list, subject: () => subject })
      .create();
    const follow = await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ accountDid: () => viewer.did })
            .create(),
        followee: () => subject,
      })
      .create();
    loginAs(viewer.did);

    // act
    const res = await client.call(getList, { list: asAtUriString(list.uri) });

    // assert
    expect(res.items[0]?.subject.viewer?.following).toBe(follow.uri);
  });
});

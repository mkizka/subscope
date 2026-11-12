import { asAtIdentifierString } from "@atproto/syntax";
import getListsWithMembership from "@repo/client/app/bsky/graph/getListsWithMembership";
import {
  accountFactory,
  listFactory,
  listItemFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.graph.getListsWithMembership", () => {
  const { ctx } = testSetup;

  const createList = (
    accountDid: string,
    purpose = "app.bsky.graph.defs#curatelist",
  ) =>
    listFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.list")
            .vars({ accountDid: () => accountDid })
            .create(),
      })
      .props({ purpose: () => purpose })
      .create();

  const createViewer = () =>
    accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();

  test("getListsWithMembership-1: 認証がないリクエストには401を返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const subject = await createViewer();

    // act
    const promise = client.call(getListsWithMembership, {
      actor: asAtIdentifierString(subject.did),
    });

    // assert
    await expect(promise).rejects.toMatchObject({ status: 401 });
  });

  test("getListsWithMembership-2: 閲覧者が作成したリストだけをlistViewで返し、他のアカウントのリストは含めない", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await createViewer();
    const other = await createViewer();
    const subject = await createViewer();
    const list = await createList(viewer.did);
    await createList(other.did);
    loginAs(viewer.did);

    // act
    const res = await client.call(getListsWithMembership, {
      actor: asAtIdentifierString(subject.did),
    });

    // assert
    expect(res.listsWithMembership).toMatchObject([
      { list: { uri: list.uri, creator: { did: viewer.did } } },
    ]);
    expect(res.listsWithMembership[0]?.listItem).toBeUndefined();
  });

  test("getListsWithMembership-3: actorがリストに含まれている場合は、listItemにlist itemのuriとactorのprofileViewを入れる", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await createViewer();
    const subject = await createViewer();
    const list = await createList(viewer.did);
    const item = await listItemFactory(ctx.db)
      .vars({ list: () => list, subject: () => subject })
      .create();
    loginAs(viewer.did);

    // act
    const res = await client.call(getListsWithMembership, {
      actor: asAtIdentifierString(subject.did),
    });

    // assert
    expect(res.listsWithMembership).toMatchObject([
      {
        list: { uri: list.uri },
        listItem: { uri: item.uri, subject: { did: subject.did } },
      },
    ]);
  });

  test("getListsWithMembership-4: purposesを指定すると、その用途のリストだけを返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await createViewer();
    const subject = await createViewer();
    await createList(viewer.did, "app.bsky.graph.defs#curatelist");
    const modlist = await createList(viewer.did, "app.bsky.graph.defs#modlist");
    loginAs(viewer.did);

    // act
    const res = await client.call(getListsWithMembership, {
      actor: asAtIdentifierString(subject.did),
      purposes: ["modlist"],
    });

    // assert
    expect(res.listsWithMembership).toMatchObject([
      { list: { uri: modlist.uri } },
    ]);
  });
});

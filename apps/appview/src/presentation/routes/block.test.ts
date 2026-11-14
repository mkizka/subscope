import { asAtIdentifierString } from "@atproto/syntax";
import getProfile from "@repo/client/app/bsky/actor/getProfile";
import {
  accountFactory,
  blockFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../shared/api-test-utils.js";

describe("ブロック", () => {
  const { ctx } = testSetup;

  type Account = Awaited<ReturnType<typeof createAccount>>;

  const createAccount = () =>
    accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();

  const createBlock = (account: Account, subject: Account) =>
    blockFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.block")
            .vars({ account: () => account })
            .create(),
        subject: () => subject,
      })
      .create();

  const createFollow = (account: Account, followee: Account) =>
    followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ account: () => account })
            .create(),
        followee: () => followee,
      })
      .create();

  const fetchViewer = async (viewer: Account, subject: Account) => {
    const { client, loginAs } = await setupApiTest();
    loginAs(viewer.did);
    const res = await client.call(getProfile, {
      actor: asAtIdentifierString(subject.did),
    });
    return res.viewer;
  };

  test("block-1: 閲覧者がブロックしているアカウントには、ブロックレコードのURIを viewer.blocking に入れる", async () => {
    // arrange
    const viewer = await createAccount();
    const subject = await createAccount();
    const block = await createBlock(viewer, subject);

    // act
    const result = await fetchViewer(viewer, subject);

    // assert
    expect(result?.blocking).toBe(block.uri);
    expect(result?.blockedBy).toBe(false);
  });

  test("block-2: 閲覧者をブロックしているアカウントには、viewer.blockedBy を true にする", async () => {
    // arrange
    const viewer = await createAccount();
    const subject = await createAccount();
    await createBlock(subject, viewer);

    // act
    const result = await fetchViewer(viewer, subject);

    // assert
    expect(result?.blockedBy).toBe(true);
    expect(result?.blocking).toBeUndefined();
  });

  test("block-3: どちらかの向きにブロックがあるアカウントには、viewer.following と viewer.followedBy を含めない", async () => {
    // arrange
    const viewer = await createAccount();
    const blocked = await createAccount();
    const blocker = await createAccount();
    for (const other of [blocked, blocker]) {
      await createFollow(viewer, other);
      await createFollow(other, viewer);
    }
    await createBlock(viewer, blocked);
    await createBlock(blocker, viewer);

    // act
    const results = [
      await fetchViewer(viewer, blocked),
      await fetchViewer(viewer, blocker),
    ];

    // assert
    for (const result of results) {
      expect(result?.following).toBeUndefined();
      expect(result?.followedBy).toBeUndefined();
    }
  });
});

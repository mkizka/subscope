import { asDid } from "@atproto/did";
import getBackfillStatuses from "@repo/client/me/subsco/sync/getBackfillStatuses";
import {
  accountFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.sync.getBackfillStatuses", () => {
  const { ctx } = testSetup;

  const createAccount = (backfillStatus?: "completed" | "error") =>
    accountFactory(ctx.db)
      .props({ backfillStatus: () => backfillStatus ?? null })
      .create();

  const createServerMember = () =>
    accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();

  type Account = Awaited<ReturnType<typeof createAccount>>;

  const follow = (follower: Account, followee: Account) =>
    followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ account: () => follower })
            .create(),
        followee: () => followee,
      })
      .create();

  test("getBackfillStatuses-1: 追跡アカウントの状態だけを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const serverMember = await createServerMember();
    const followee = await createAccount("completed");
    const other = await createAccount("completed");
    const otherFollowee = await createAccount("completed");
    await follow(serverMember, followee);
    await follow(other, otherFollowee);

    // act
    const res = await client.call(getBackfillStatuses, {
      dids: [serverMember, followee, other, otherFollowee].map((a) =>
        asDid(a.did),
      ),
    });

    // assert
    expect(res.statuses.sort((a, b) => a.did.localeCompare(b.did))).toEqual(
      [
        { did: serverMember.did, status: "inProgress", isMember: true },
        { did: followee.did, status: "completed", isMember: false },
      ].sort((a, b) => a.did.localeCompare(b.did)),
    );
  });

  test("getBackfillStatuses-2: 状態をまだ確認していないアカウントは同期中として返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const serverMember = await createServerMember();

    // act
    const res = await client.call(getBackfillStatuses, {
      dids: [asDid(serverMember.did)],
    });

    // assert
    expect(res.statuses).toEqual([
      { did: serverMember.did, status: "inProgress", isMember: true },
    ]);
  });

  test("getBackfillStatuses-3: 認証がなくても状態を返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const serverMember = await createServerMember();

    // act
    const res = await client.call(getBackfillStatuses, {
      dids: [asDid(serverMember.did)],
    });

    // assert
    expect(res.statuses).toHaveLength(1);
  });

  test("getBackfillStatuses-4: アカウントごとにメンバーかどうかを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const serverMember = await createServerMember();
    const followee = await createAccount();
    await follow(serverMember, followee);

    // act
    const res = await client.call(getBackfillStatuses, {
      dids: [serverMember, followee].map((a) => asDid(a.did)),
    });

    // assert
    expect(
      Object.fromEntries(res.statuses.map((s) => [s.did, s.isMember])),
    ).toEqual({ [serverMember.did]: true, [followee.did]: false });
  });
});

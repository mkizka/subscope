import { asDid } from "@atproto/did";
import getTrackingStatuses from "@repo/client/me/subsco/sync/getTrackingStatuses";
import {
  accountFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.sync.getTrackingStatuses", () => {
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

  test("getTrackingStatuses-1: 追跡アカウントだけを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const serverMember = await createServerMember();
    const followee = await createAccount("completed");
    const other = await createAccount("completed");
    const otherFollowee = await createAccount("completed");
    await follow(serverMember, followee);
    await follow(other, otherFollowee);

    // act
    const res = await client.call(getTrackingStatuses, {
      dids: [serverMember, followee, other, otherFollowee].map((a) =>
        asDid(a.did),
      ),
    });

    // assert
    expect(res.statuses.sort((a, b) => a.did.localeCompare(b.did))).toEqual(
      [
        { did: serverMember.did, isMember: true, backfillStatus: "inProgress" },
        { did: followee.did, isMember: false, backfillStatus: "completed" },
      ].sort((a, b) => a.did.localeCompare(b.did)),
    );
  });

  test("getTrackingStatuses-2: 状態をまだ確認していないアカウントは同期中として返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const serverMember = await createServerMember();

    // act
    const res = await client.call(getTrackingStatuses, {
      dids: [asDid(serverMember.did)],
    });

    // assert
    expect(res.statuses).toEqual([
      { did: serverMember.did, isMember: true, backfillStatus: "inProgress" },
    ]);
  });

  test("getTrackingStatuses-3: 認証がなくても状態を返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const serverMember = await createServerMember();

    // act
    const res = await client.call(getTrackingStatuses, {
      dids: [asDid(serverMember.did)],
    });

    // assert
    expect(res.statuses).toHaveLength(1);
  });

  test("getTrackingStatuses-4: アカウントごとにメンバーかどうかを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const serverMember = await createServerMember();
    const followee = await createAccount();
    await follow(serverMember, followee);

    // act
    const res = await client.call(getTrackingStatuses, {
      dids: [serverMember, followee].map((a) => asDid(a.did)),
    });

    // assert
    expect(
      Object.fromEntries(res.statuses.map((s) => [s.did, s.isMember])),
    ).toEqual({ [serverMember.did]: true, [followee.did]: false });
  });
});
